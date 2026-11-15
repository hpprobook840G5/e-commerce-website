import env from '../src/config/env.js'
import { getTransporter, transporter } from '../src/config/mailer.js'

function getRecipientDomain(email) {
  if (!email || typeof email !== 'string') return 'unknown'
  const atIndex = email.lastIndexOf('@')
  return atIndex !== -1 ? email.slice(atIndex + 1).toLowerCase().trim() : 'unknown'
}

async function run() {
  const isProduction = env.isProduction || process.env.NODE_ENV === 'production'
  const hasConfirm = process.argv.includes('--confirm')

  if (isProduction && !hasConfirm) {
    console.error('Error: Refusing to run in production mode without --confirm flag.')
    console.error('Usage: node scripts/send-test-email.js <recipient> --confirm')
    process.exit(1)
  }

  // Filter out any flag arguments to isolate the recipient
  const recipient = process.argv.slice(2).find((arg) => !arg.startsWith('--'))

  if (!recipient || !recipient.includes('@')) {
    console.error('Error: A valid recipient email address is required.')
    console.error('Usage: node scripts/send-test-email.js you@example.com')
    process.exit(1)
  }

  const activeTransporter = getTransporter ? getTransporter() : transporter

  if (!activeTransporter) {
    console.error('Error: SMTP transporter is not initialized. Please check SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.')
    process.exit(1)
  }

  const domain = getRecipientDomain(recipient)
  console.log(`[Test Email] Testing delivery to domain: @${domain}`)

  // 1. Verify connection
  try {
    await activeTransporter.verify()
    console.log('Verify Result: OK (transporter verified)')
  } catch (verifyErr) {
    console.error(`Verify Result: FAILED (${verifyErr.code || verifyErr.name || 'UNKNOWN'}) - ${verifyErr.message}`)
    process.exit(1)
  }

  // 2. Send test email
  const subject = 'AirTouch SMTP test'
  const textBody = 'This is an automated delivery test email from AirTouch Engineering.'
  const htmlBody = '<p>This is an automated delivery test email from <strong>AirTouch Engineering</strong>.</p>'

  try {
    const info = await activeTransporter.sendMail({
      from: env.SMTP_FROM,
      to: recipient,
      subject,
      text: textBody,
      html: htmlBody,
    })

    const acceptedCount = Array.isArray(info.accepted) ? info.accepted.length : 0
    const rejectedCount = Array.isArray(info.rejected) ? info.rejected.length : 0
    const rawResponse = String(info.response || '')
    const responseTruncated = rawResponse.length > 200 ? rawResponse.slice(0, 200) + '...' : rawResponse

    console.log(`Accepted Count: ${acceptedCount}`)
    console.log(`Rejected Count: ${rejectedCount}`)
    console.log(`SMTP Response: ${responseTruncated}`)
    console.log(`Message ID: ${info.messageId || 'none'}`)
    console.log(`Recipient Domain: @${domain}`)

    if (rejectedCount > 0) {
      console.warn(`[Warning]: Recipient was rejected by the mail server: ${rawResponse}`)
      process.exit(2)
    }

    console.log('[Test Email] Test email accepted for delivery.')
  } catch (sendErr) {
    console.error(`Send Error: ${sendErr.code || sendErr.name || 'UNKNOWN'} - ${sendErr.message}`)
    if (sendErr.response) {
      console.error(`SMTP Response: ${String(sendErr.response).slice(0, 200)}`)
    }
    process.exit(1)
  }
}

run()
