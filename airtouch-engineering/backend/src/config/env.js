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
  while (
    (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length >= 2) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'") && cleaned.length >= 2)
  ) {
    cleaned = cleaned.slice(1, -1).trim()
  }
  return cleaned
}

/**
 * Parses an environment variable as a positive integer (> 0).
 * Falls back to the provided fallback value if missing, NaN, or <= 0.
 *
 * @param {string} val
 * @param {number} fallback
 * @returns {number}
 */
function parsePositiveInt(val, fallback) {
  const parsed = parseInt(val, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

// Rate Limiting Configuration
export const RATE_LIMIT_WINDOW_MINUTES = parsePositiveInt(cleanEnv(process.env.RATE_LIMIT_WINDOW_MINUTES), 15)
export const RATE_LIMIT_LOGIN_MAX = parsePositiveInt(cleanEnv(process.env.RATE_LIMIT_LOGIN_MAX), 5)
export const RATE_LIMIT_SIGNUP_MAX = parsePositiveInt(cleanEnv(process.env.RATE_LIMIT_SIGNUP_MAX), 10)
export const RATE_LIMIT_OTP_MAX = parsePositiveInt(cleanEnv(process.env.RATE_LIMIT_OTP_MAX), 3)
export const RATE_LIMIT_RESET_MAX = parsePositiveInt(cleanEnv(process.env.RATE_LIMIT_RESET_MAX), 5)
export const RATE_LIMIT_DEV_MULTIPLIER = parsePositiveInt(cleanEnv(process.env.RATE_LIMIT_DEV_MULTIPLIER), 10)

export const isProduction = cleanEnv(process.env.NODE_ENV) === 'production'

// Log active rate limit profile at startup (only profile name, no values beyond that)
if (cleanEnv(process.env.NODE_ENV) !== 'test') {
  console.log(
    isProduction
      ? 'Rate limits: production'
      : `Rate limits: development x${RATE_LIMIT_DEV_MULTIPLIER}`
  )
}

// Supabase Configuration
const requiredSupabaseVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']

export const isAuthConfigured = Boolean(
  cleanEnv(process.env.SUPABASE_URL) &&
  cleanEnv(process.env.SUPABASE_ANON_KEY) &&
  cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
  !cleanEnv(process.env.SUPABASE_URL).includes('placeholder')
)

/**
 * Verify if email and OTP secrets are configured.
 * Returns true if all required settings are non-empty.
 * Logs only missing variable names, never secrets.
 */
export function checkEmailConfig() {
  const missing = []
  if (!cleanEnv(process.env.SMTP_HOST)) missing.push('SMTP_HOST')
  if (!cleanEnv(process.env.SMTP_USER)) missing.push('SMTP_USER')
  if (!cleanEnv(process.env.SMTP_PASS)) missing.push('SMTP_PASS')
  if (!cleanEnv(process.env.OTP_HMAC_SECRET)) missing.push('OTP_HMAC_SECRET')

  if (missing.length > 0) {
    console.warn(`[Email Service Warning]: Missing configuration variables: ${missing.join(', ')}`)
    return false
  }
  return true
}

export const isEmailConfigured = checkEmailConfig()

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
  CUSTOMER_JWT_SECRET: cleanEnv(process.env.CUSTOMER_JWT_SECRET) || cleanEnv(process.env.JWT_SECRET) || 'airtouch-customer-auth-jwt-secret-min-32-chars-long',
  CONTACT_IP_SALT: cleanEnv(process.env.CONTACT_IP_SALT) || 'dev-contact-ip-salt-default',
  // Nodemailer SMTP
  SMTP_HOST: cleanEnv(process.env.SMTP_HOST),
  SMTP_PORT: parseInt(cleanEnv(process.env.SMTP_PORT) || '587', 10),
  SMTP_SECURE: cleanEnv(process.env.SMTP_SECURE) === 'true',
  SMTP_USER: cleanEnv(process.env.SMTP_USER),
  SMTP_PASS: cleanEnv(process.env.SMTP_PASS),
  SMTP_FROM: cleanEnv(process.env.SMTP_FROM) || 'AirTouch Engineering <no-reply@example.com>',
  // OTP HMAC and Timing
  OTP_HMAC_SECRET: cleanEnv(process.env.OTP_HMAC_SECRET),
  OTP_TTL_MINUTES: parseInt(cleanEnv(process.env.OTP_TTL_MINUTES) || '10', 10),
  OTP_MAX_ATTEMPTS: parseInt(cleanEnv(process.env.OTP_MAX_ATTEMPTS) || '5', 10),
  RESET_TOKEN_MINUTES: parseInt(cleanEnv(process.env.RESET_TOKEN_MINUTES) || '15', 10),
  // Rate Limiting
  RATE_LIMIT_WINDOW_MINUTES,
  RATE_LIMIT_LOGIN_MAX,
  RATE_LIMIT_SIGNUP_MAX,
  RATE_LIMIT_OTP_MAX,
  RATE_LIMIT_RESET_MAX,
  RATE_LIMIT_DEV_MULTIPLIER,
  isProduction,
  isAuthConfigured,
  isEmailConfigured,
}
