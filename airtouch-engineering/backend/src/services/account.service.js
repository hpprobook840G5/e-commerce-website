import { AuthService } from './auth.service.js'
import { AddressService } from './address.service.js'
import { supabaseAdmin } from '../config/supabase.js'
import { normalizeIndianMobile } from '../utils/phone.js'

export class AccountService {
  /**
   * Check whether a customer profile is fully completed.
   * A profile is complete when full_name, mobile, has_password, and at least one address exist.
   *
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  static async checkProfileComplete(userId) {
    if (!userId) return false

    const profile = await AuthService.getProfile(userId)
    if (!profile) return false

    const hasName = Boolean(profile.full_name && profile.full_name.trim().length >= 2)
    const hasMobile = Boolean(profile.mobile && /^\+91[6-9]\d{9}$/.test(profile.mobile))

    if (!hasName || !hasMobile) {
      return false
    }

    // Check has_password flag from Supabase user auth metadata or profile cache
    let hasPassword = Boolean(profile.has_password)
    if (!hasPassword && supabaseAdmin) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
        hasPassword = Boolean(user?.user_metadata?.has_password)
      } catch (err) {
        console.warn('[AccountService Check Password Warning]:', err.message)
      }
    }

    if (!hasPassword) {
      return false
    }

    // Check addresses
    const addresses = await AddressService.listAddresses(userId)
    const hasAddress = Boolean(addresses && addresses.length > 0)

    return Boolean(hasName && hasMobile && hasPassword && hasAddress)
  }

  /**
   * Complete account profile provisioning after OTP verification.
   * - Rejects if profile is already complete (409)
   * - Rejects if mobile is registered to another user (409)
   * - Sets password through supabaseAdmin.auth.admin.updateUserById(userId, { password })
   * - Updates customer profile with fullName and normalized mobile
   * - Inserts delivery address as default address
   *
   * @param {string} userId - Authenticated user UUID
   * @param {object} param1 - { fullName, mobile, password, address }
   * @returns {Promise<{ profile: object, address: object, profileComplete: boolean }>}
   */
  static async createAccount(userId, { fullName, mobile, password, address }) {
    if (!userId) {
      const err = new Error('User ID is required')
      err.status = 401
      throw err
    }

    // 1. Reject if the user already has a complete profile
    const alreadyComplete = await this.checkProfileComplete(userId)
    if (alreadyComplete) {
      const err = new Error('Account profile is already complete.')
      err.status = 409
      throw err
    }

    // 2. Validate and normalize mobile number
    const normalizedMobile = normalizeIndianMobile(mobile)
    if (!normalizedMobile) {
      const err = new Error('Please enter a valid 10-digit Indian mobile number')
      err.status = 400
      throw err
    }

    // 3. Ensure mobile number is unique across profiles
    let existingMobile = null
    if (supabaseAdmin) {
      try {
        const { data: dbMobile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('mobile', normalizedMobile)
          .neq('id', userId)
          .maybeSingle()

        if (dbMobile) {
          existingMobile = dbMobile
        }
      } catch (e) {
        console.warn('[AccountService Mobile Lookup DB Warning]:', e.message)
      }
    }

    if (!existingMobile && AuthService.getMemoryProfiles) {
      for (const [pId, pData] of AuthService.getMemoryProfiles()) {
        if (pId !== userId && pData.mobile === normalizedMobile) {
          existingMobile = { id: pId }
          break
        }
      }
    }

    if (existingMobile) {
      const err = new Error('This mobile number is already registered.')
      err.status = 409
      throw err
    }

    // 4. Set customer password via Supabase Admin (hashes nothing itself)
    if (password && supabaseAdmin) {
      try {
        const { error: pwdError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: String(password),
          user_metadata: { has_password: true },
        })

        if (pwdError) {
          console.warn('[AccountService Set Password Warning]:', pwdError.message)
          if (!pwdError.message?.toLowerCase().includes('not found')) {
            const err = new Error('Failed to set account password.')
            err.status = 500
            throw err
          }
        }
      } catch (err) {
        if (err.status) throw err
        console.warn('[AccountService Update Password Exception]:', err.message)
      }
    }

    // 5. Update customer profile
    let profile = null
    try {
      profile = await AuthService.updateProfile(userId, {
        fullName,
        mobile: normalizedMobile,
        has_password: true,
      })
    } catch (dbErr) {
      // Handle database unique constraint violations gracefully
      if (
        dbErr.code === '23505' ||
        dbErr.message?.toLowerCase().includes('unique') ||
        dbErr.message?.includes('mobile')
      ) {
        const err = new Error('This mobile number is already registered.')
        err.status = 409
        throw err
      }
      throw dbErr
    }

    // 6. Insert delivery address as default address
    const createdAddress = await AddressService.createAddress(userId, {
      ...address,
      fullName: address.fullName || fullName,
      mobile: address.mobile || normalizedMobile,
      is_default: true,
    })

    return {
      profile,
      address: createdAddress,
      profileComplete: true,
    }
  }

  /**
   * Retrieve full account information for an authenticated customer:
   * Profile, addresses list, default address, and profileComplete status.
   *
   * @param {string} userId
   * @returns {Promise<{ profile: object, addresses: Array<object>, defaultAddress: object|null, profileComplete: boolean }>}
   */
  static async getAccount(userId) {
    if (!userId) {
      const err = new Error('User ID is required')
      err.status = 401
      throw err
    }

    const profile = await AuthService.getProfile(userId)
    const addresses = await AddressService.listAddresses(userId)
    const defaultAddress = addresses.find((a) => a.is_default) || addresses[0] || null
    const profileComplete = await this.checkProfileComplete(userId)

    return {
      profile,
      addresses,
      defaultAddress,
      profileComplete,
    }
  }

  /**
   * Update profile fields on customer account (fullName and/or mobile only).
   * Email is immutable.
   *
   * @param {string} userId
   * @param {object} updates - { fullName, mobile }
   * @returns {Promise<object>} Updated profile
   */
  static async updateAccount(userId, updates) {
    if (updates.mobile) {
      const normalizedMobile = normalizeIndianMobile(updates.mobile)
      if (!normalizedMobile) {
        const err = new Error('Please enter a valid 10-digit Indian mobile number')
        err.status = 400
        throw err
      }

      // Check mobile uniqueness
      if (supabaseAdmin) {
        const { data: existingMobile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('mobile', normalizedMobile)
          .neq('id', userId)
          .maybeSingle()

        if (existingMobile) {
          const err = new Error('This mobile number is already registered.')
          err.status = 409
          throw err
        }
      }
      updates.mobile = normalizedMobile
    }

    return AuthService.updateProfile(userId, updates)
  }
}

export default AccountService
