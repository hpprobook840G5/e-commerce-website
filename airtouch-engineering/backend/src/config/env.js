import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Explicitly resolve path to backend/.env from this file's directory
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../../.env')

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

/**
 * Sanitizes an environment variable value:
 * - Trims whitespace
 * - Strips enclosing matching quotes (single or double)
 * - Returns clean string
 *
 * @param {string|undefined} val
 * @returns {string}
 */
function cleanEnv(val) {
  if (val === undefined || val === null) return ''
  let cleaned = String(val).trim()
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length >= 2) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'") && cleaned.length >= 2)
  ) {
    cleaned = cleaned.slice(1, -1).trim()
  }
  return cleaned
}

// Supabase Configuration
const requiredSupabaseVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']

export const isAuthConfigured = Boolean(
  cleanEnv(process.env.SUPABASE_URL) &&
  cleanEnv(process.env.SUPABASE_ANON_KEY) &&
  cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
  !cleanEnv(process.env.SUPABASE_URL).includes('placeholder')
)

// Sanitized SMTP & OTP Variables
const smtpHost = cleanEnv(process.env.SMTP_HOST)
const smtpPort = cleanEnv(process.env.SMTP_PORT) || '587'
const smtpSecure = cleanEnv(process.env.SMTP_SECURE) || 'false'
const smtpUser = cleanEnv(process.env.SMTP_USER)
const smtpPass = cleanEnv(process.env.SMTP_PASS)
const smtpFrom = cleanEnv(process.env.SMTP_FROM) || 'AirTouch Engineering <no-reply@example.com>'

const otpHmacSecret = cleanEnv(process.env.OTP_HMAC_SECRET)
const otpTtlMinutes = cleanEnv(process.env.OTP_TTL_MINUTES) || '10'
const otpMaxAttempts = cleanEnv(process.env.OTP_MAX_ATTEMPTS) || '5'

// Validate required OTP configuration variables by name only
const missingOrInvalid = []

if (!smtpHost || smtpHost.toLowerCase().includes('your') || smtpHost.includes('<') || smtpHost.includes('>') || smtpHost.toLowerCase().includes('example.com')) {
  missingOrInvalid.push('SMTP_HOST')
}
if (!smtpPort || !/^\d+$/.test(smtpPort)) {
  missingOrInvalid.push('SMTP_PORT')
}
if (smtpSecure !== 'true' && smtpSecure !== 'false') {
  missingOrInvalid.push('SMTP_SECURE')
}
if (!smtpUser || smtpUser.toLowerCase().includes('your') || smtpUser.includes('<') || smtpUser.includes('>') || smtpUser.toLowerCase().includes('example.com')) {
  missingOrInvalid.push('SMTP_USER')
}
if (!smtpPass || smtpPass.toLowerCase().includes('your') || smtpPass.includes('<') || smtpPass.includes('>') || smtpPass.toLowerCase().includes('example.com')) {
  missingOrInvalid.push('SMTP_PASS')
}
if (!smtpFrom || smtpFrom.toLowerCase().includes('your') || smtpFrom.toLowerCase().includes('example.com')) {
  missingOrInvalid.push('SMTP_FROM')
}
if (!otpHmacSecret || otpHmacSecret.length < 32 || otpHmacSecret.toLowerCase().includes('your') || otpHmacSecret.toLowerCase().includes('example.com')) {
  missingOrInvalid.push('OTP_HMAC_SECRET')
}
if (!otpTtlMinutes || !/^\d+$/.test(otpTtlMinutes) || parseInt(otpTtlMinutes, 10) <= 0) {
  missingOrInvalid.push('OTP_TTL_MINUTES')
}
if (!otpMaxAttempts || !/^\d+$/.test(otpMaxAttempts) || parseInt(otpMaxAttempts, 10) <= 0) {
  missingOrInvalid.push('OTP_MAX_ATTEMPTS')
}

// Log startup config status: exactly one line with names only
if (missingOrInvalid.length === 0) {
  console.log('OTP config OK')
} else {
  console.log(`OTP config missing: ${missingOrInvalid.join(', ')}`)
}

export const isSmtpConfigured = Boolean(
  smtpHost &&
  smtpUser &&
  smtpPass &&
  !missingOrInvalid.includes('SMTP_HOST') &&
  !missingOrInvalid.includes('SMTP_USER') &&
  !missingOrInvalid.includes('SMTP_PASS')
)

export const isOtpConfigured = Boolean(
  isSmtpConfigured &&
  missingOrInvalid.length === 0
)

export default {
  PORT: cleanEnv(process.env.PORT) || 5000,
  CORS_ORIGIN: cleanEnv(process.env.CORS_ORIGIN) || 'http://localhost:5173',
  FRONTEND_URL: cleanEnv(process.env.FRONTEND_URL) || 'http://localhost:5173',
  SUPABASE_URL: cleanEnv(process.env.SUPABASE_URL),
  SUPABASE_ANON_KEY: cleanEnv(process.env.SUPABASE_ANON_KEY),
  SUPABASE_SERVICE_ROLE_KEY: cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
  JWT_SECRET: cleanEnv(process.env.JWT_SECRET) || 'dev-secret-key-change-in-production',
  RESEND_API_KEY: cleanEnv(process.env.RESEND_API_KEY),
  EMAIL_FROM: cleanEnv(process.env.EMAIL_FROM),
  ADMIN_EMAIL: cleanEnv(process.env.ADMIN_EMAIL),
  ADMIN_PASSWORD_HASH: cleanEnv(process.env.ADMIN_PASSWORD_HASH),
  ADMIN_JWT_SECRET: cleanEnv(process.env.ADMIN_JWT_SECRET) || cleanEnv(process.env.JWT_SECRET) || 'dev-admin-jwt-secret',
  ADMIN_SESSION_HOURS: parseInt(cleanEnv(process.env.ADMIN_SESSION_HOURS) || '8', 10),
  CONTACT_IP_SALT: cleanEnv(process.env.CONTACT_IP_SALT) || 'dev-contact-ip-salt-default',
  // SMTP settings
  SMTP_HOST: smtpHost,
  SMTP_PORT: parseInt(smtpPort, 10),
  SMTP_SECURE: smtpSecure === 'true',
  SMTP_USER: smtpUser,
  SMTP_PASS: smtpPass,
  SMTP_FROM: smtpFrom,
  // OTP settings
  OTP_HMAC_SECRET: otpHmacSecret,
  OTP_TTL_MINUTES: parseInt(otpTtlMinutes, 10),
  OTP_MAX_ATTEMPTS: parseInt(otpMaxAttempts, 10),
  isAuthConfigured,
  isSmtpConfigured,
  isOtpConfigured,
}
