import crypto from 'crypto'
import env, { isSmtpConfigured } from '../config/env.js'
import { supabaseAdmin } from '../config/supabase.js'
import { sendMail } from '../config/mailer.js'

// In-memory fallback cache for development/tests when DB table is not yet migrated
const memoryOtpCodes = new Map()

export class OtpService {
  /**
   * Request an OTP for a given email address.
   * Normalizes email, generates a 6-digit numeric OTP, computes HMAC-SHA256,
   * invalidates older unused codes, persists the new record, and sends email via Nodemailer.
   * Plaintext code is never logged.
   *
   * @param {string} email
   * @returns {Promise<{ ok: boolean, message: string }>}
   */
  static async requestOtp(email) {
    if (!env.OTP_HMAC_SECRET || !isSmtpConfigured) {
      const err = new Error('Email sign-in is not configured')
      err.status = 503
      throw err
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // Generate secure 6-digit integer [100000, 999999]
    const code = String(crypto.randomInt(100000, 1000000))

    // Compute HMAC-SHA256 digest
    const codeHash = crypto
      .createHmac('sha256', env.OTP_HMAC_SECRET)
      .update(`${normalizedEmail}:${code}`)
      .digest('hex')

    const now = new Date()
    const expiresAt = new Date(now.getTime() + env.OTP_TTL_MINUTES * 60 * 1000).toISOString()
    const nowIso = now.toISOString()

    // 1. Invalidate prior unused codes for that email
    try {
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('email_otp_codes')
          .update({ used_at: nowIso })
          .eq('email', normalizedEmail)
          .is('used_at', null)
      }
    } catch (dbErr) {
      console.warn('[OtpService Invalidate Warning]:', dbErr.message)
    }

    // Invalidate in memory store
    const memList = memoryOtpCodes.get(normalizedEmail) || []
    memList.forEach((c) => {
      if (!c.used_at) c.used_at = nowIso
    })

    // 2. Insert new row
    let insertedInDb = false
    try {
      if (supabaseAdmin) {
        const { error: insertErr } = await supabaseAdmin
          .from('email_otp_codes')
          .insert({
            email: normalizedEmail,
            code_hash: codeHash,
            purpose: 'login',
            expires_at: expiresAt,
            attempts: 0,
            created_at: nowIso,
          })

        if (!insertErr) {
          insertedInDb = true
        } else {
          console.warn('[OtpService DB Insert Warning]:', insertErr.message)
        }
      }
    } catch (insertEx) {
      console.warn('[OtpService Insert Exception]:', insertEx.message)
    }

    // Always keep in memory store as fallback
    const newEntry = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      code_hash: codeHash,
      purpose: 'login',
      expires_at: expiresAt,
      attempts: 0,
      used_at: null,
      created_at: nowIso,
    }
    memList.push(newEntry)
    memoryOtpCodes.set(normalizedEmail, memList)

    // 3. Send email via Nodemailer
    const mailText = [
      `Your AirTouch Engineering verification code is: ${code}`,
      '',
      `This code will expire in ${env.OTP_TTL_MINUTES} minutes.`,
      'If you did not request this verification code, you can safely ignore this email.',
    ].join('\n')

    const mailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;">AirTouch Engineering</h2>
        <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 16px 0;">Use the following verification code to log in to your account:</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0284c7; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; margin: 16px 0;">This code is valid for <strong>${env.OTP_TTL_MINUTES} minutes</strong> and can only be used once.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">If you did not make this request, please disregard this email. Never share your verification code with anyone.</p>
      </div>
    `

    await sendMail({
      to: normalizedEmail,
      subject: `Your AirTouch Engineering Login Code: ${code}`,
      text: mailText,
      html: mailHtml,
    })

    return {
      ok: true,
      message: 'If that email is valid, a code has been sent.',
    }
  }

  /**
   * Verify an OTP code.
   * Loads the latest unused and unexpired code, checks attempt limits,
   * compares HMAC in constant time, and marks code as used.
   *
   * @param {string} email
   * @param {string} code
   * @returns {Promise<{ ok: boolean }>}
   */
  static async verifyOtp(email, code) {
    if (!env.OTP_HMAC_SECRET) {
      const err = new Error('Email sign-in is not configured')
      err.status = 503
      throw err
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const cleanCode = String(code).trim()

    let record = null
    const nowIso = new Date().toISOString()

    // 1. Try to fetch latest unused, unexpired record from DB
    try {
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from('email_otp_codes')
          .select('*')
          .eq('email', normalizedEmail)
          .eq('purpose', 'login')
          .is('used_at', null)
          .gt('expires_at', nowIso)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!error && data) {
          record = data
        }
      }
    } catch (e) {
      console.warn('[OtpService Verify Lookup Warning]:', e.message)
    }

    // Fallback to memory store if no DB record found
    if (!record) {
      const memList = memoryOtpCodes.get(normalizedEmail) || []
      const candidates = memList
        .filter((c) => !c.used_at && c.purpose === 'login' && new Date(c.expires_at) > new Date())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      if (candidates.length > 0) {
        record = candidates[0]
      }
    }

    // Fail if no active unexpired code found
    if (!record) {
      const err = new Error('Invalid or expired code.')
      err.status = 400
      throw err
    }

    // Fail if attempts limit reached
    if ((record.attempts || 0) >= env.OTP_MAX_ATTEMPTS) {
      const err = new Error('Invalid or expired code.')
      err.status = 400
      throw err
    }

    // Increment attempts
    const newAttempts = (record.attempts || 0) + 1
    record.attempts = newAttempts

    try {
      if (supabaseAdmin && record.id) {
        await supabaseAdmin
          .from('email_otp_codes')
          .update({ attempts: newAttempts })
          .eq('id', record.id)
      }
    } catch (updErr) {
      console.warn('[OtpService Increment Attempts Warning]:', updErr.message)
    }

    // Compute candidate HMAC
    const candidateHash = crypto
      .createHmac('sha256', env.OTP_HMAC_SECRET)
      .update(`${normalizedEmail}:${cleanCode}`)
      .digest('hex')

    // Constant-time comparison
    const candidateBuffer = Buffer.from(candidateHash, 'hex')
    const expectedBuffer = Buffer.from(record.code_hash, 'hex')

    const isMatch =
      candidateBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(candidateBuffer, expectedBuffer)

    if (!isMatch) {
      const err = new Error('Invalid or expired code.')
      err.status = 400
      throw err
    }

    // On match: mark code as used
    record.used_at = nowIso
    try {
      if (supabaseAdmin && record.id) {
        await supabaseAdmin
          .from('email_otp_codes')
          .update({ used_at: nowIso })
          .eq('id', record.id)
      }
    } catch (useErr) {
      console.warn('[OtpService Mark Used Warning]:', useErr.message)
    }

    return { ok: true }
  }
}

export default OtpService

