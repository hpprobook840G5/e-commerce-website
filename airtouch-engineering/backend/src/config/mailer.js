import nodemailer from 'nodemailer'
import env, { isSmtpConfigured } from './env.js'

let transporter = null

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })

  // Verify connection configuration on startup (logging status only, never credentials)
  transporter.verify((error) => {
    if (error) {
      console.error(`[SMTP Verification Failed]: ${error.code || 'UNKNOWN'}. Hint: Check SMTP_USER and the Gmail App Password.`)
    } else {
      console.log('[SMTP Verification Success]: SMTP server is ready to deliver messages')
    }
  })
} else {
  console.log('[SMTP Info]: SMTP transporter disabled (credentials not configured).')
}

/**
 * Send an email message via the configured Nodemailer transporter.
 *
 * @param {object} mailOptions - { to, subject, text, html }
 * @returns {Promise<object>} Nodemailer send result
 */
export async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    const error = new Error('Email sign-in is not configured')
    error.status = 503
    throw error
  }

  return transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  })
}

export { transporter }
export default transporter

