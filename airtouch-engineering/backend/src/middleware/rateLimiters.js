import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import env from '../config/env.js'

/**
 * Creates an HMAC-SHA256 hash of the normalized email address.
 * Ensures no plain email addresses are stored in rate limit memory keys.
 *
 * @param {string} email
 * @returns {string} Hex hash
 */
export function hashEmail(email) {
  if (!email) return 'anonymous'
  const secret = env.OTP_HMAC_SECRET || env.CONTACT_IP_SALT || 'rate-limit-email-salt'
  return crypto
    .createHmac('sha256', secret)
    .update(String(email).toLowerCase().trim())
    .digest('hex')
    .slice(0, 24)
}

/**
 * OTP Request Limiter (Per Email Hash):
 * 5 requests per 15 minutes per email hash.
 */
export const otpRequestEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `otp_req_email_${hashEmail(req.body?.email)}`,
  message: {
    message: 'Too many OTP requests for this email. Please wait 15 minutes before requesting again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * OTP Request Limiter (Per IP):
 * 20 requests per 15 minutes per IP.
 */
export const otpRequestIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.ip,
  message: {
    message: 'Too many OTP requests from this network. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Combined OTP Request Limiter array
 */
export const otpRequestLimiter = [otpRequestIpLimiter, otpRequestEmailLimiter]

/**
 * OTP Verification Limiter:
 * 10 attempts per 15 minutes per email hash and per IP.
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const emailHash = hashEmail(req.body?.email)
    return `otp_ver_${req.ip}_${emailHash}`
  },
  message: {
    message: 'Too many OTP verification attempts. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Password Login Rate Limiter:
 * 5 failed attempts per 15 minutes per email and per IP.
 */
export const passwordLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.email
    return `pwd_${req.ip}_${hashEmail(email)}`
  },
  message: {
    message: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Backwards compatibility aliases
export const emailOtpLimiter = otpRequestEmailLimiter
export const ipOtpLimiter = otpRequestIpLimiter

export default {
  otpRequestEmailLimiter,
  otpRequestIpLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  passwordLoginLimiter,
  emailOtpLimiter,
  ipOtpLimiter,
  hashEmail,
}
