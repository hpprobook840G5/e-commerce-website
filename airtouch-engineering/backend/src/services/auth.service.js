import { supabaseAnon, supabaseAdmin } from '../config/supabase.js'
import { mapAuthError } from '../utils/authErrors.js'
import env, { isOtpConfigured } from '../config/env.js'
import OtpService from './otp.service.js'
import AddressService from './address.service.js'

// In-memory fallback store for development/testing when Supabase table migration is pending
const memoryProfiles = new Map()

/**
 * Computes whether a customer profile is complete.
 * A profile is complete when full_name, mobile, password, and at least one address exist.
 */
async function computeProfileComplete(userId, profile, userObj) {
  if (!profile?.full_name?.trim() || !profile?.mobile?.trim()) {
    return false
  }

  // Must have a password set
  let hasPassword = Boolean(profile.has_password || userObj?.user_metadata?.has_password)
  if (!hasPassword && supabaseAdmin) {
    try {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
      hasPassword = Boolean(user?.user_metadata?.has_password)
    } catch {
      // ignore
    }
  }

  if (!hasPassword) {
    return false
  }

  const addresses = await AddressService.listAddresses(userId)
  return Boolean(addresses && addresses.length > 0)
}

export class AuthService {
  /**
   * Returns in-memory profile store (used for tests and dev fallbacks)
   */
  static getMemoryProfiles() {
    return memoryProfiles
  }
  /**
   * Request an Email OTP via Nodemailer.
   * Generates secure 6-digit code, saves HMAC hash, sends email.
   * Always returns a generic message to prevent account enumeration.
   *
   * @param {string} email - Lowercased, trimmed email
   */
  static async requestOtp(email) {
    const normalizedEmail = String(email).toLowerCase().trim()

    try {
      await OtpService.requestOtp(normalizedEmail)
    } catch (err) {
      if (err.status === 503) {
        throw err
      }
      // Log server-side for diagnostics, but return generic success to avoid enumeration
      console.error('[OtpService requestOtp Error]:', err.message)
    }

    return {
      success: true,
      message: 'If that email is valid, a code has been sent.',
    }
  }

  /**
   * Verify an Email OTP code using constant-time HMAC check.
   * Creates Supabase user if not exists, issues session via magiclink token exchange,
   * provisions profile, and returns { session, user, isNewUser }.
   *
   * @param {string} email - Lowercased, trimmed email
   * @param {string} tokenOrCode - 6-digit numeric OTP
   */
  static async verifyOtp(email, tokenOrCode) {
    const normalizedEmail = String(email).toLowerCase().trim()
    const cleanCode = String(tokenOrCode).trim()

    // 1. Verify OTP code validity, attempts limit, and expiry via OtpService
    await OtpService.verifyOtp(normalizedEmail, cleanCode)

    if (!supabaseAdmin || !supabaseAnon) {
      const err = new Error('Authentication is not configured')
      err.status = 503
      throw err
    }

    // 2. Ensure user exists in Supabase Auth (create if new)
    try {
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      })
    } catch (createErr) {
      // User might already exist (422 / User already registered), which is normal
    }

    // 3. Generate magiclink token hash to establish session server-side
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
    })

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error('[generateLink Error]:', linkErr?.message || 'No token returned')
      const err = new Error('Failed to create authentication session.')
      err.status = 500
      throw err
    }

    const hashedToken = linkData.properties.hashed_token
    const verificationType = linkData.properties.verification_type || 'magiclink'

    // 4. Exchange hashed_token for official Supabase session tokens
    const { data: sessionData, error: sessionErr } = await supabaseAnon.auth.verifyOtp({
      token_hash: hashedToken,
      type: verificationType,
    })

    if (sessionErr || !sessionData?.session || !sessionData?.user) {
      console.error('[verifyOtp Session Exchange Error]:', sessionErr?.message || 'No session returned')
      const err = new Error('Failed to create authentication session.')
      err.status = 500
      throw err
    }

    const { session, user } = sessionData

    // 5. Provision or retrieve customer profile
    const { profile, isNewUser } = await this.ensureProfile(user, { email: normalizedEmail })
    const profileComplete = await computeProfileComplete(user.id, profile, user)

    return {
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at,
      },
      user: {
        id: user.id,
        email: profile?.email || user.email || normalizedEmail,
        fullName: profile?.full_name || null,
        mobile: profile?.mobile || null,
        role: profile?.role || 'customer',
        profileComplete,
      },
      profile,
      isNewUser,
      profileComplete,
    }
  }

  /**
   * Initiates Google OAuth flow via Supabase.
   * Validates redirectTo against FRONTEND_URL.
   *
   * @param {string} customRedirect
   */
  static async getGoogleAuthUrl(customRedirect) {
    if (!supabaseAnon) {
      const err = new Error('Authentication is not configured')
      err.status = 503
      throw err
    }

    const frontendBase = env.FRONTEND_URL || 'http://localhost:5173'
    let targetRedirect = `${frontendBase}/auth/callback`

    if (customRedirect && typeof customRedirect === 'string') {
      try {
        const parsed = new URL(customRedirect, frontendBase)
        const allowed = new URL(frontendBase)
        if (parsed.origin === allowed.origin) {
          targetRedirect = parsed.toString()
        }
      } catch {
        // Fallback to default callback
      }
    }

    const { data, error } = await supabaseAnon.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: targetRedirect,
      },
    })

    if (error || !data?.url) {
      console.error('[Google OAuth Error]:', error?.message || 'No URL returned')
      const mapped = mapAuthError(error, 'Google authentication is currently unavailable.')
      const err = new Error(mapped.message)
      err.status = mapped.status || 500
      throw err
    }

    return { url: data.url }
  }

  /**
   * Password login for customers using email.
   * Always returns a generic failure message to prevent account enumeration.
   *
   * @param {string} email
   * @param {string} password
   */
  static async passwordLogin(email, password) {
    if (!supabaseAnon || !supabaseAdmin) {
      const err = new Error('Authentication is not configured')
      err.status = 503
      throw err
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error || !data?.session || !data?.user) {
      console.warn('[Password Login Failed]:', error?.message || 'Invalid credentials')
      const err = new Error('Invalid email or password.')
      err.status = 401
      throw err
    }

    const { session, user } = data

    // Password login should only work for accounts that have a password set
    const hasPassword = Boolean(user.user_metadata?.has_password)
    if (!hasPassword && user.app_metadata?.provider !== 'email') {
      console.warn('[Password Login Blocked]: User does not have a password configured.')
      const err = new Error('Invalid email or password.')
      err.status = 401
      throw err
    }

    const { profile } = await this.ensureProfile(user, { email: normalizedEmail })
    const profileComplete = await computeProfileComplete(user.id, profile, user)

    return {
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at,
      },
      user: {
        id: user.id,
        email: profile?.email || user.email || normalizedEmail,
        fullName: profile?.full_name || null,
        mobile: profile?.mobile || null,
        role: profile?.role || 'customer',
        profileComplete,
      },
      profile,
      isNewUser: false,
      profileComplete,
    }
  }

  /**
   * Ensure a profile exists for an authenticated Supabase user.
   * Creates the profile if missing (e.g. after Google OAuth or first OTP login).
   *
   * @param {object} user - Supabase user object
   * @param {object} overrides - Optional fields { email, fullName, mobile }
   */
  static async ensureProfile(user, overrides = {}) {
    if (!supabaseAdmin) {
      const err = new Error('Authentication is not configured')
      err.status = 503
      throw err
    }

    let profile = null
    let isNewUser = false

    // 1. Check existing profile by ID
    try {
      const { data: dbProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (dbProfile) {
        profile = dbProfile
      }
    } catch (e) {
      console.warn('[Profile Lookup DB Warning]:', e.message)
    }

    if (!profile && memoryProfiles.has(user.id)) {
      profile = memoryProfiles.get(user.id)
    }

    if (profile) {
      return { profile, isNewUser: false }
    }

    // 2. Profile does not exist - Provision new profile
    isNewUser = true
    const userEmail = overrides.email || user.email || ''
    const userFullName =
      overrides.fullName ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      null
    const userMobile = overrides.mobile || user.phone || null

    const newProfile = {
      id: user.id,
      email: userEmail.toLowerCase().trim(),
      full_name: userFullName,
      mobile: userMobile,
      role: 'customer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single()

      if (!insertErr && inserted) {
        profile = inserted
      } else {
        profile = newProfile
      }
    } catch {
      profile = newProfile
    }

    memoryProfiles.set(user.id, profile)
    return { profile, isNewUser: true }
  }

  /**
   * Revoke active session in Supabase.
   *
   * @param {string} accessToken
   */
  static async logout(accessToken) {
    if (!supabaseAdmin) {
      const err = new Error('Authentication is not configured')
      err.status = 503
      throw err
    }

    try {
      await supabaseAdmin.auth.admin.signOut(accessToken)
    } catch (err) {
      console.warn('[Logout Revocation Warning]:', err.message)
    }

    return {
      success: true,
      message: 'Logged out successfully.',
    }
  }

  /**
   * Get customer profile by User ID.
   *
   * @param {string} userId
   */
  static async getProfile(userId) {
    if (!supabaseAdmin) {
      const err = new Error('Authentication is not configured')
      err.status = 503
      throw err
    }

    let profile = null
    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      profile = data
    } catch (e) {
      console.warn('[Profile Fetch Warning]:', e.message)
    }

    if (!profile && memoryProfiles.has(userId)) {
      profile = memoryProfiles.get(userId)
    }

    return profile
  }

  /**
   * Update full_name and optional mobile on customer profile.
   * Email is immutable.
   *
   * @param {string} userId
   * @param {object} updates - { fullName, mobile }
   */
  static async updateProfile(userId, { fullName, mobile, has_password } = {}) {
    if (!supabaseAdmin) {
      const err = new Error('Authentication is not configured')
      err.status = 503
      throw err
    }

    const payload = {
      updated_at: new Date().toISOString(),
    }

    if (fullName !== undefined) {
      payload.full_name = fullName ? String(fullName).trim() : null
    }

    if (mobile !== undefined) {
      payload.mobile = mobile ? String(mobile).trim() : null
    }

    let updatedProfile = null
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select()
        .single()

      if (!error && data) {
        updatedProfile = data
      }
    } catch (e) {
      console.warn('[Profile Update Warning]:', e.message)
    }

    if (!updatedProfile) {
      const existing = memoryProfiles.get(userId) || { id: userId }
      updatedProfile = {
        ...existing,
        ...payload,
      }
    }

    if (has_password !== undefined) {
      updatedProfile.has_password = Boolean(has_password)
    }

    memoryProfiles.set(userId, updatedProfile)
    return updatedProfile
  }

  /**
   * Get current authenticated user and profile from access token.
   *
   * @param {string} accessToken
   */
  static async getCurrentUser(accessToken) {
    if (!supabaseAdmin) {
      const err = new Error('Authentication is not configured')
      err.status = 503
      throw err
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)

    if (error || !user) {
      const err = new Error('Invalid or expired authorization token')
      err.status = 401
      throw err
    }

    let profile = await this.getProfile(user.id)
    if (!profile) {
      const ensured = await this.ensureProfile(user)
      profile = ensured.profile
    }

    const profileComplete = await computeProfileComplete(user.id, profile, user)

    return {
      user: {
        id: user.id,
        email: profile?.email || user.email || '',
        fullName: profile?.full_name || null,
        mobile: profile?.mobile || null,
        role: profile?.role || 'customer',
        profileComplete,
      },
      profile,
      profileComplete,
    }
  }
}

export default AuthService
