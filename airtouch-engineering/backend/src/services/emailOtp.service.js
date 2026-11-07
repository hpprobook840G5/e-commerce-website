import crypto from 'crypto'
import env from '../config/env.js'
import { supabaseAdmin } from '../config/supabase.js'
import { sendMail } from '../config/mailer.js'

// In-memory fallback for local development or testing before migrations are run
const memoryOtps = []

/**
 * Derives a concise, secure hint from a mail delivery error without exposing sensitive data.
 *
 * @param {object} err - Error object from nodemailer
 * @returns {string} Short error code and hint
 */
function getErrorHint(err) {
  const code = err.code || err.name || 'UNKNOWN'
  if (code === 'EAUTH' || err.responseCode === 535) {
    return 'EAUTH: check SMTP_USER and the Gmail App Password'
  }
  if (code === 'ECONNECTION' || code === 'ESOCKET' || code === 'ETIMEDOUT') {
    return 'ECONNECTION: check SMTP_HOST and SMTP_PORT'
  }
  if (code === 'EENVELOPE') {
    return 'EENVELOPE: check SMTP_FROM and recipient email format'
  }
  return `${code}: email delivery failed`
}

/**
 * Computes an HMAC-SHA256 digest for an OTP code.
 *
 * @param {string} email
 * @param {string} purpose
 * @param {string} code
 * @returns {string} Hex-encoded HMAC digest
 */
function computeCodeHash(email, purpose, code) {
  const secret = env.OTP_HMAC_SECRET
  if (!secret) {
    const err = new Error('Email service is not configured.')
    err.status = 503
    throw err
  }
  const payload = `${email}:${purpose}:${code}`
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export class EmailOtpService {
  /**
   * Generates a 6-digit OTP, stores its HMAC hash in DB/memory, and sends an email.
   *
   * @param {string} email
   * @param {'signup_verify'|'password_reset'} purpose
   * @returns {Promise<boolean>}
   */
  static async generateOtp(email, purpose) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail || !purpose) {
      const err = new Error('Email and purpose are required.')
      err.status = 400
      throw err
    }

    // If SMTP or OTP_HMAC_SECRET is missing, return 503 and log only variable names
    if (!env.OTP_HMAC_SECRET || !env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      const missing = []
      if (!env.SMTP_HOST) missing.push('SMTP_HOST')
      if (!env.SMTP_USER) missing.push('SMTP_USER')
      if (!env.SMTP_PASS) missing.push('SMTP_PASS')
      if (!env.OTP_HMAC_SECRET) missing.push('OTP_HMAC_SECRET')
      console.warn(`[Email Service Warning]: Missing configuration variables: ${missing.join(', ')}`)

      const err = new Error('Email service is not configured.')
      err.status = 503
      throw err
    }

    // Generate secure 6-digit integer (100000 - 999999)
    const code = crypto.randomInt(100000, 1000000).toString()
    const codeHash = computeCodeHash(normalizedEmail, purpose, code)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + env.OTP_TTL_MINUTES * 60 * 1000)

    // 1. Invalidate previous unused codes for this email and purpose in database
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('email_otps')
          .update({ used_at: now.toISOString() })
          .eq('email', normalizedEmail)
          .eq('purpose', purpose)
          .is('used_at', null)
      } catch (dbErr) {
        console.warn('[EmailOtpService Invalidate DB Warning]:', dbErr.message)
      }
    }

    // Invalidate in memory
    for (const item of memoryOtps) {
      if (item.email === normalizedEmail && item.purpose === purpose && !item.used_at) {
        item.used_at = now.toISOString()
      }
    }

    // 2. Insert new OTP record
    const newOtpRecord = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      purpose,
      code_hash: codeHash,
      attempts: 0,
      expires_at: expiresAt.toISOString(),
      used_at: null,
      created_at: now.toISOString(),
    }

    if (supabaseAdmin) {
      try {
        const { error: insertErr } = await supabaseAdmin
          .from('email_otps')
          .insert(newOtpRecord)
        if (insertErr) {
          console.warn('[EmailOtpService Insert DB Warning]:', insertErr.message)
        }
      } catch (insertEx) {
        console.warn('[EmailOtpService Insert DB Exception]:', insertEx.message)
      }
    }

    // Always keep in memory store
    memoryOtps.push(newOtpRecord)

    // 3. Compose Email
    const isSignup = purpose === 'signup_verify'
    const subject = isSignup
      ? 'Verify your AirTouch Engineering account'
      : 'Reset your AirTouch Engineering password'

    const purposeTitle = isSignup ? 'Account Verification' : 'Password Reset'
    const instructions = isSignup
      ? 'Please use the 6-digit verification code below to complete your registration.'
      : 'You requested a password reset. Please use the 6-digit code below to set a new password.'

    const textBody = `AirTouch Engineering - ${purposeTitle}

${instructions}

Verification Code: ${code}

This code will expire in ${env.OTP_TTL_MINUTES} minutes.
Do NOT share this code with anyone. AirTouch Engineering engineers or representatives will never ask for your verification code.

If you did not request this, you can safely ignore this email.
`

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f4f4f5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: #ffffff;">
                AIRTOUCH <span style="color: #f97316;">ENGINEERING</span>
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #a1a1aa;">
                ${purposeTitle}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 0; border-top: 1px solid #27272a; border-bottom: 1px solid #27272a;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #d4d4d8;">
                ${instructions}
              </p>
              <div style="background-color: #09090b; border: 1px solid #f97316; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
                <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #f97316;">
                  ${code}
                </span>
              </div>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                This code expires in <strong>${env.OTP_TTL_MINUTES} minutes</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 20px;">
              <p style="margin: 0; font-size: 11px; line-height: 1.4; color: #71717a; text-align: center;">
                Security Note: Never share this code with anyone. If you did not make this request, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

    // 4. Send email and await delivery; catch delivery errors without logging secrets
    try {
      await sendMail({
        to: normalizedEmail,
        subject,
        text: textBody,
        html: htmlBody,
      })
      return true
    } catch (mailErr) {
      const hint = getErrorHint(mailErr)
      console.error(`[Email Delivery Failure]: ${hint}`)

      // Mark the newly created OTP record unusable immediately
      const nowIso = new Date().toISOString()
      newOtpRecord.used_at = nowIso

      if (supabaseAdmin) {
        try {
          await supabaseAdmin
            .from('email_otps')
            .update({ used_at: nowIso })
            .eq('id', newOtpRecord.id)
        } catch (cleanupErr) {
          console.warn('[EmailOtpService Cleanup DB Warning]:', cleanupErr.message)
        }
      }

      // Throw error with status 502 so callers report delivery failure
      const err = new Error('Could not send the verification email. Please try again.')
      err.status = 502
      throw err
    }
  }

  /**
   * Verifies an OTP code using timingSafeEqual.
   *
   * @param {string} email
   * @param {'signup_verify'|'password_reset'} purpose
   * @param {string} code
   * @returns {Promise<boolean>}
   */
  static async verifyOtp(email, purpose, code) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const cleanCode = String(code || '').trim()

    if (!normalizedEmail || !purpose || cleanCode.length !== 6) {
      return false
    }

    if (!env.OTP_HMAC_SECRET) {
      const err = new Error('Email service is not configured.')
      err.status = 503
      throw err
    }

    const now = new Date()

    // 1. Fetch latest unused OTP record
    let otpRecord = null

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('email_otps')
          .select('*')
          .eq('email', normalizedEmail)
          .eq('purpose', purpose)
          .is('used_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!error && data) {
          otpRecord = data
        }
      } catch (dbErr) {
        console.warn('[EmailOtpService Verify DB Lookup Warning]:', dbErr.message)
      }
    }

    if (!otpRecord) {
      // Find in memory fallback
      for (let i = memoryOtps.length - 1; i >= 0; i--) {
        const item = memoryOtps[i]
        if (item.email === normalizedEmail && item.purpose === purpose && !item.used_at) {
          otpRecord = item
          break
        }
      }
    }

    if (!otpRecord) {
      return false
    }

    // 2. Check if expired or max attempts reached
    const expiresAt = new Date(otpRecord.expires_at)
    if (now > expiresAt || otpRecord.attempts >= env.OTP_MAX_ATTEMPTS) {
      return false
    }

    // 3. Increment attempts count before comparing
    otpRecord.attempts += 1
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('email_otps')
          .update({ attempts: otpRecord.attempts })
          .eq('id', otpRecord.id)
      } catch (updErr) {
        console.warn('[EmailOtpService Update Attempts Warning]:', updErr.message)
      }
    }

    // 4. Compute candidate HMAC-SHA256 hash
    let candidateHash = ''
    try {
      candidateHash = computeCodeHash(normalizedEmail, purpose, cleanCode)
    } catch {
      return false
    }

    // 5. Compare using crypto.timingSafeEqual on equal-length buffers
    const expectedBuf = Buffer.from(otpRecord.code_hash, 'hex')
    const candidateBuf = Buffer.from(candidateHash, 'hex')

    if (expectedBuf.length !== candidateBuf.length) {
      return false
    }

    const isMatch = crypto.timingSafeEqual(expectedBuf, candidateBuf)

    if (isMatch) {
      // Mark as used
      const usedAt = now.toISOString()
      otpRecord.used_at = usedAt

      if (supabaseAdmin) {
        try {
          await supabaseAdmin
            .from('email_otps')
            .update({ used_at: usedAt })
            .eq('id', otpRecord.id)
        } catch (usedErr) {
          console.warn('[EmailOtpService Mark Used DB Warning]:', usedErr.message)
        }
      }

      return true
    }

    return false
  }
}

export default EmailOtpService
