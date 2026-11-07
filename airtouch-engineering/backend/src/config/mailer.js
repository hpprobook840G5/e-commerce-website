import nodemailer from 'nodemailer'
import env from './env.js'

let transporter = null

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  const port = parseInt(env.SMTP_PORT, 10) || 587
  const isPort465 = port === 465
  const isPort587 = port === 587

  const transportConfig = {
    host: env.SMTP_HOST,
    port: port,
    secure: isPort465 ? true : Boolean(env.SMTP_SECURE),
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  }

  // If port 587 or secure is false, enforce STARTTLS
  if (isPort587 || (!isPort465 && !env.SMTP_SECURE)) {
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

/**
 * Sends an email using the configured SMTP transporter.
 *
 * @param {object} mailOptions - { to, subject, text, html }
 * @returns {Promise<object>}
 */
export async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
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

  return transporter.sendMail(options)
}

export default {
  sendMail,
}
