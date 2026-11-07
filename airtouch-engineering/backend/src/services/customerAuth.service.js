import crypto from 'crypto'
import { supabaseAdmin } from '../config/supabase.js'
import { hashPassword, comparePassword } from '../utils/hash.js'
import { generateCustomerToken, generateResetToken, verifyResetToken } from '../utils/jwt.js'
import { normalizeIndianMobile } from '../validators/customerAuth.validators.js'
import EmailOtpService from './emailOtp.service.js'

/**
 * Strips password_hash and formats customer user object for API responses.
 *
 * @param {object} u - Database user object
 * @returns {object} Clean user object
 */
export function sanitizeUser(u) {
  if (!u) return null
  return {
    id: u.id,
    fullName: u.full_name || u.fullName,
    email: u.email,
    mobile: u.mobile,
    addressLine1: u.address_line1 || u.addressLine1,
    landmark: u.landmark || null,
    district: u.district,
    state: u.state,
    pincode: u.pincode,
    country: u.country || 'India',
    emailVerified: u.email_verified ?? true,
    emailVerifiedAt: u.email_verified_at || null,
    createdAt: u.created_at || u.createdAt,
    lastLoginAt: u.last_login_at || u.lastLoginAt,
  }
}

export class CustomerAuthService {
  /**
   * Helper to look up a user by email directly from user_details table
   */
  static async findUserByEmail(email) {
    const normalized = String(email || '').trim().toLowerCase()
    if (!normalized) return null

    if (!supabaseAdmin) {
      const err = new Error('Database service is not configured.')
      err.status = 500
      throw err
    }

    const { data, error } = await supabaseAdmin
      .from('user_details')
      .select('*')
      .eq('email', normalized)
      .maybeSingle()

    if (error) {
      console.error('[CustomerAuthService findUserByEmail DB Error]:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      const err = new Error('Database query failed.')
      err.status = 500
      throw err
    }

    return data || null
  }

  /**
   * Helper to look up a user by ID directly from user_details table
   */
  static async findUserById(id) {
    if (!id) return null

    if (!supabaseAdmin) {
      const err = new Error('Database service is not configured.')
      err.status = 500
      throw err
    }

    const { data, error } = await supabaseAdmin
      .from('user_details')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('[CustomerAuthService findUserById DB Error]:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      const err = new Error('Database query failed.')
      err.status = 500
      throw err
    }

    return data || null
  }

  /**
   * Register a new customer in user_details table with email_verified = false.
   * Sends a 6-digit signup_verify OTP.
   * Does NOT return a login token.
   *
   * @param {object} data - Form data
   * @returns {Promise<{ status: string, email: string }>}
   */
  static async signup(data) {
    const normalizedEmail = String(data.email || '').trim().toLowerCase()
    const normalizedMobile = normalizeIndianMobile(data.mobile)

    if (!normalizedEmail || !normalizedMobile) {
      const err = new Error('Invalid email or mobile number.')
      err.status = 400
      throw err
    }

    if (!supabaseAdmin) {
      const err = new Error('Database service is not configured.')
      err.status = 500
      throw err
    }

    // 1. Check for duplicate email or mobile in database
    const { data: dbEmail, error: emailLookupErr } = await supabaseAdmin
      .from('user_details')
      .select('id, email_verified, mobile')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (emailLookupErr) {
      console.error('[CustomerAuthService Signup Lookup DB Error]:', {
        code: emailLookupErr.code,
        message: emailLookupErr.message,
        details: emailLookupErr.details,
        hint: emailLookupErr.hint,
      })
      const err = new Error('Database query failed.')
      err.status = 500
      throw err
    }

    const { data: dbMobile, error: mobileLookupErr } = await supabaseAdmin
      .from('user_details')
      .select('id, email_verified, email')
      .eq('mobile', normalizedMobile)
      .maybeSingle()

    if (mobileLookupErr) {
      console.error('[CustomerAuthService Signup Lookup DB Error]:', {
        code: mobileLookupErr.code,
        message: mobileLookupErr.message,
        details: mobileLookupErr.details,
        hint: mobileLookupErr.hint,
      })
      const err = new Error('Database query failed.')
      err.status = 500
      throw err
    }

    // 2. Handle existing unverified accounts vs verified accounts
    if (dbEmail) {
      if (dbEmail.email_verified) {
        const err = new Error('An account with this email or mobile number already exists.')
        err.status = 409
        throw err
      }

      // If mobile belongs to a different account, reject conflict
      if (dbMobile && dbMobile.id !== dbEmail.id) {
        const err = new Error('An account with this email or mobile number already exists.')
        err.status = 409
        throw err
      }

      // Existing unverified account: update details so user can recover after failed email send
      const hashedPassword = await hashPassword(data.password)
      const now = new Date().toISOString()
      const updateData = {
        full_name: String(data.fullName || '').trim(),
        mobile: normalizedMobile,
        password_hash: hashedPassword,
        address_line1: String(data.addressLine1 || '').trim(),
        landmark: data.landmark ? String(data.landmark).trim() : null,
        district: String(data.district || '').trim(),
        state: String(data.state || '').trim(),
        pincode: String(data.pincode || '').trim(),
        country: data.country ? String(data.country).trim() : 'India',
        updated_at: now,
      }

      const { error: updErr } = await supabaseAdmin
        .from('user_details')
        .update(updateData)
        .eq('id', dbEmail.id)

      if (updErr) {
        console.error('[CustomerAuthService Signup Retry Update DB Error]:', {
          code: updErr.code,
          message: updErr.message,
          details: updErr.details,
          hint: updErr.hint,
        })
        if (updErr.code === '23505' || updErr.message?.toLowerCase().includes('unique')) {
          const err = new Error('An account with this email or mobile number already exists.')
          err.status = 409
          throw err
        }
        if (updErr.code === '23514' || updErr.message?.toLowerCase().includes('check constraint')) {
          const err = new Error('Registration details failed validation constraint.')
          err.status = 400
          throw err
        }
        const err = new Error('Could not save your details. Please try again.')
        err.status = 500
        throw err
      }

      // Generate fresh signup verification OTP
      try {
        await EmailOtpService.generateOtp(normalizedEmail, 'signup_verify')
      } catch (otpErr) {
        otpErr.status = otpErr.status || 502
        throw otpErr
      }

      return {
        status: 'verification_required',
        email: normalizedEmail,
      }
    }

    if (dbMobile) {
      const err = new Error('An account with this email or mobile number already exists.')
      err.status = 409
      throw err
    }

    // 3. Brand new registration: hash password and insert
    const hashedPassword = await hashPassword(data.password)
    const now = new Date().toISOString()
    const newRecord = {
      id: crypto.randomUUID(),
      full_name: String(data.fullName || '').trim(),
      email: normalizedEmail,
      mobile: normalizedMobile,
      password_hash: hashedPassword,
      address_line1: String(data.addressLine1 || '').trim(),
      landmark: data.landmark ? String(data.landmark).trim() : null,
      district: String(data.district || '').trim(),
      state: String(data.state || '').trim(),
      pincode: String(data.pincode || '').trim(),
      country: data.country ? String(data.country).trim() : 'India',
      email_verified: false,
      email_verified_at: null,
      password_changed_at: null,
      created_at: now,
      updated_at: now,
      last_login_at: null,
    }

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('user_details')
      .insert(newRecord)
      .select()
      .single()

    if (insertErr) {
      console.error('[CustomerAuthService Insert DB Error]:', {
        code: insertErr.code,
        message: insertErr.message,
        details: insertErr.details,
        hint: insertErr.hint,
      })

      if (
        insertErr.code === '23505' ||
        insertErr.message?.toLowerCase().includes('unique')
      ) {
        const err = new Error('An account with this email or mobile number already exists.')
        err.status = 409
        throw err
      }

      if (
        insertErr.code === '23514' ||
        insertErr.message?.toLowerCase().includes('check constraint')
      ) {
        const err = new Error('Registration details failed validation constraint.')
        err.status = 400
        throw err
      }

      const err = new Error('Could not save your details. Please try again.')
      err.status = 500
      throw err
    }

    if (!inserted) {
      const err = new Error('Could not save your details. Please try again.')
      err.status = 500
      throw err
    }

    // 4. Send signup verification OTP (only reached if DB insert succeeded)
    try {
      await EmailOtpService.generateOtp(normalizedEmail, 'signup_verify')
    } catch (otpErr) {
      otpErr.status = otpErr.status || 502
      throw otpErr
    }

    return {
      status: 'verification_required',
      email: normalizedEmail,
    }
  }

  /**
   * Verifies customer signup OTP code.
   * On success, marks email_verified = true and issues login token.
   *
   * @param {object} param0 - { email, code }
   * @returns {Promise<{ token: string, user: object }>}
   */
  static async verifySignup({ email, code }) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const isValid = await EmailOtpService.verifyOtp(normalizedEmail, 'signup_verify', code)

    if (!isValid) {
      const err = new Error('Invalid or expired code.')
      err.status = 400
      throw err
    }

    // Look up user from database
    const user = await this.findUserByEmail(normalizedEmail)
    if (!user) {
      const err = new Error('Account not found.')
      err.status = 404
      throw err
    }

    const now = new Date().toISOString()
    user.email_verified = true
    user.email_verified_at = now
    user.last_login_at = now

    if (supabaseAdmin) {
      const { error: updErr } = await supabaseAdmin
        .from('user_details')
        .update({
          email_verified: true,
          email_verified_at: now,
          last_login_at: now,
        })
        .eq('id', user.id)

      if (updErr) {
        console.error('[CustomerAuthService verifySignup Update DB Error]:', {
          code: updErr.code,
          message: updErr.message,
          details: updErr.details,
          hint: updErr.hint,
        })
        const err = new Error('Failed to update verification status.')
        err.status = 500
        throw err
      }
    }

    const token = generateCustomerToken(user)
    return {
      token,
      user: sanitizeUser(user),
    }
  }

  /**
   * Resends signup verification OTP.
   *
   * @param {object} param0 - { email }
   * @returns {Promise<{ message: string }>}
   */
  static async resendSignupOtp({ email }) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const user = await this.findUserByEmail(normalizedEmail)

    if (user && !user.email_verified) {
      try {
        await EmailOtpService.generateOtp(normalizedEmail, 'signup_verify')
      } catch (otpErr) {
        otpErr.status = otpErr.status || 502
        throw otpErr
      }
    }

    return {
      message: 'If an unverified account exists for that email, a verification code has been sent.',
    }
  }

  /**
   * Authenticate customer with email and password.
   * If correct credentials but email_verified is false, returns 403 EMAIL_NOT_VERIFIED.
   *
   * @param {object} credentials - { email, password }
   * @returns {Promise<{ token: string, user: object }>}
   */
  static async login({ email, password }) {
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!normalizedEmail || !password) {
      const err = new Error('Invalid email or password.')
      err.status = 401
      throw err
    }

    const user = await this.findUserByEmail(normalizedEmail)

    // Return identical generic error to prevent account enumeration
    if (!user) {
      const err = new Error('Invalid email or password.')
      err.status = 401
      throw err
    }

    // Compare password with bcrypt
    const isMatch = await comparePassword(password, user.password_hash)
    if (!isMatch) {
      const err = new Error('Invalid email or password.')
      err.status = 401
      throw err
    }

    // Check email verification status
    if (user.email_verified === false) {
      // Send fresh verification OTP
      try {
        await EmailOtpService.generateOtp(user.email, 'signup_verify')
      } catch (otpErr) {
        console.warn('[CustomerAuthService Resend Verification OTP Warning]:', otpErr.message)
      }

      const err = new Error('Please verify your email address to continue.')
      err.status = 403
      err.code = 'EMAIL_NOT_VERIFIED'
      err.email = user.email
      throw err
    }

    // Update last_login_at in database
    const now = new Date().toISOString()
    user.last_login_at = now

    if (supabaseAdmin) {
      const { error: updErr } = await supabaseAdmin
        .from('user_details')
        .update({ last_login_at: now })
        .eq('id', user.id)

      if (updErr) {
        console.warn('[CustomerAuthService Update Login DB Warning]:', {
          code: updErr.code,
          message: updErr.message,
        })
      }
    }

    const token = generateCustomerToken(user)

    return {
      token,
      user: sanitizeUser(user),
    }
  }

  /**
   * Initiates forgot password flow.
   *
   * @param {object} param0 - { email }
   * @returns {Promise<{ message: string }>}
   */
  static async forgotPassword({ email }) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const user = await this.findUserByEmail(normalizedEmail)

    if (user) {
      try {
        await EmailOtpService.generateOtp(normalizedEmail, 'password_reset')
      } catch (otpErr) {
        console.error('[CustomerAuthService ForgotPassword Delivery Error]:', otpErr.message)
      }
    }

    return {
      message: 'If that email is registered, a code has been sent.',
    }
  }

  /**
   * Verifies password reset OTP and issues a short-lived resetToken.
   *
   * @param {object} param0 - { email, code }
   * @returns {Promise<{ resetToken: string }>}
   */
  static async verifyPasswordResetOtp({ email, code }) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const isValid = await EmailOtpService.verifyOtp(normalizedEmail, 'password_reset', code)

    if (!isValid) {
      const err = new Error('Invalid or expired code.')
      err.status = 400
      throw err
    }

    const user = await this.findUserByEmail(normalizedEmail)
    if (!user) {
      const err = new Error('Invalid or expired code.')
      err.status = 400
      throw err
    }

    const resetToken = generateResetToken(user.id)
    return {
      resetToken,
    }
  }

  /**
   * Resets customer password using resetToken, then logs them in immediately.
   *
   * @param {object} param0 - { resetToken, password }
   * @returns {Promise<{ token: string, user: object }>}
   */
  static async resetPassword({ resetToken, password }) {
    let decoded = null
    try {
      decoded = verifyResetToken(resetToken)
    } catch {
      const err = new Error('Invalid or expired reset token.')
      err.status = 400
      throw err
    }

    const userId = decoded.sub
    const user = await this.findUserById(userId)
    if (!user) {
      const err = new Error('User not found.')
      err.status = 404
      throw err
    }

    const hashedPassword = await hashPassword(password)
    const now = new Date().toISOString()

    user.password_hash = hashedPassword
    user.password_changed_at = now
    user.email_verified = true
    user.last_login_at = now

    if (supabaseAdmin) {
      const { error: updErr } = await supabaseAdmin
        .from('user_details')
        .update({
          password_hash: hashedPassword,
          password_changed_at: now,
          email_verified: true,
          last_login_at: now,
        })
        .eq('id', user.id)

      if (updErr) {
        console.error('[CustomerAuthService resetPassword DB Error]:', {
          code: updErr.code,
          message: updErr.message,
          details: updErr.details,
          hint: updErr.hint,
        })
        const err = new Error('Failed to update password.')
        err.status = 500
        throw err
      }
    }

    const token = generateCustomerToken(user)
    return {
      token,
      user: sanitizeUser(user),
    }
  }

  /**
   * Retrieve customer record by ID.
   *
   * @param {string} id - Customer UUID
   * @returns {Promise<object>}
   */
  static async getCurrentUser(id) {
    const user = await this.findUserById(id)

    if (!user) {
      const err = new Error('User not found.')
      err.status = 404
      throw err
    }

    return sanitizeUser(user)
  }
}

export default CustomerAuthService
