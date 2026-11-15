import nodemailer from 'nodemailer'
import env from './env.js'

let transporter = null

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  const port = parseInt(env.SMTP_PORT, 10) || 587
  const isPort465 = port === 465
  const isPort587 = port === 587

  // Port 465 requires SSL/TLS on connect (secure: true).
  // Port 587 requires STARTTLS (secure: false, requireTLS: true).
  const isSecure = isPort465 ? true : isPort587 ? false : Boolean(env.SMTP_SECURE)

  const transportConfig = {
    host: env.SMTP_HOST,
    port: port,
    secure: isSecure,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  }

  // Enforce STARTTLS for port 587 or whenever direct SSL is not enabled
  if (isPort587 || !isSecure) {
    transportConfig.requireTLS = true
  }

  transporter = nodemailer.createTransport(transportConfig)

  transporter.verify((error) => {
    if (error) {
      console.warn(`[Mailer Warning]: Verification failed with code ${error.code || error.name || 'UNKNOWN'}`)
    } else {
      console.log('[Mailer]: SMTP transporter verified and ready to send mail')
    }
  })
} else {
  console.log('[Mailer]: SMTP credentials not fully configured; transporter initialized in mock/disabled mode')
}

export function getTransporter() {
  return transporter
}

export { transporter }

/**
 * Extracts the domain from an email address safely without exposing the username.
 *
 * @param {string} email
 * @returns {string}
 */
export function getRecipientDomain(email) {
  if (!email || typeof email !== 'string') return 'unknown'
  const atIndex = email.lastIndexOf('@')
  return atIndex !== -1 ? email.slice(atIndex + 1).toLowerCase().trim() : 'unknown'
}

/**
 * Sends an email with observability tracking.
 * - Awaits transporter.sendMail
 * - Checks info.accepted and info.rejected
 * - Throws if recipient is in rejected or accepted is empty
 * - Logs one line: purpose, result, SMTP code, recipient domain only, messageId
 *
 * @param {object} param0 - { to, subject, text, html, purpose }
 * @returns {Promise<object>}
 */
export async function sendTrackedMail({ to, subject, text, html, purpose = 'general' }) {
  if (!transporter || !env.SMTP_FROM) {
    if (!env.SMTP_FROM) {
      console.warn('[Mailer Warning]: Missing configuration variable: SMTP_FROM')
    }
    const err = new Error('Email service is not configured.')
    err.status = 503
    throw err
  }

  const options = {
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  }

  const info = await transporter.sendMail(options)
  const domain = getRecipientDomain(to)

  const accepted = Array.isArray(info.accepted) ? info.accepted : []
  const rejected = Array.isArray(info.rejected) ? info.rejected : []

  // Extract SMTP response code (e.g. 250 from "250 2.0.0 OK ...")
  const responseCodeMatch = String(info.response || '').match(/^(\d{3})/)
  const smtpCode = responseCodeMatch ? responseCodeMatch[1] : (info.responseCode || '250')

  if (rejected.length > 0 || accepted.length === 0) {
    console.error(
      `[Mailer]: purpose=${purpose} result=rejected code=${smtpCode} domain=${domain} messageId=${info.messageId || 'none'}`
    )
    const err = new Error('Email was rejected by the recipient mail server.')
    err.code = 'EREJECTED'
    err.responseCode = smtpCode
    err.rejected = rejected
    throw err
  }

  console.log(
    `[Mailer]: purpose=${purpose} result=accepted code=${smtpCode} domain=${domain} messageId=${info.messageId || 'none'}`
  )
  return info
}

/**
 * Sends an email using the configured SMTP transporter.
 *
 * @param {object} mailOptions - { to, subject, text, html }
 * @returns {Promise<object>}
 */
export async function sendMail({ to, subject, text, html }) {
  return sendTrackedMail({ to, subject, text, html, purpose: 'general' })
}

export default {
  sendMail,
  sendTrackedMail,
  getTransporter,
  transporter,
}
