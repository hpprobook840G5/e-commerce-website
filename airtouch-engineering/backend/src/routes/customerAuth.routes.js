import crypto from 'crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import env from '../config/env.js'
import customerAuthController from '../controllers/customerAuth.controller.js'
import {
  signupValidator,
  loginValidator,
  signupVerifyValidator,
  signupResendValidator,
  forgotPasswordValidator,
  passwordVerifyValidator,
  passwordResetValidator,
} from '../validators/customerAuth.validators.js'
import validate from '../middleware/validate.js'
import authenticateCustomer from '../middleware/authenticateCustomer.js'

const router = Router()

const isProduction = env.isProduction ?? ((process.env.NODE_ENV || '').trim() === 'production')
const getEffectiveMax = (baseMax) =>
  isProduction ? baseMax : baseMax * env.RATE_LIMIT_DEV_MULTIPLIER

/**
 * Creates an HMAC-SHA256 hash of the normalized email address.
 * Ensures no plain email addresses are stored in rate limit memory keys.
 *
 * @param {string} email
 * @returns {string} Hex hash
 */
export function hashEmail(email) {
  if (!email) return 'anonymous'
  const secret = env.OTP_HMAC_SECRET || env.CONTACT_IP_SALT || 'airtouch-rate-limit-email-salt'
  return crypto
    .createHmac('sha256', secret)
    .update(String(email).toLowerCase().trim())
    .digest('hex')
    .slice(0, 24)
}

const windowMs = env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000

/**
 * Rate Limiter for Customer Login:
 * Failed attempts per RATE_LIMIT_WINDOW_MINUTES per email and per IP address.
 */
export const customerLoginLimiter = rateLimit({
  windowMs,
  max: getEffectiveMax(env.RATE_LIMIT_LOGIN_MAX),
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = req.body?.email
    return `pwd_${req.ip}_${hashEmail(email)}`
  },
  message: {
    error: 'Too Many Requests',
    message: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate Limiter for Customer Sign-up:
 * Sign-up attempts per RATE_LIMIT_WINDOW_MINUTES per IP address.
 */
export const customerSignupLimiter = rateLimit({
  windowMs,
  max: getEffectiveMax(env.RATE_LIMIT_SIGNUP_MAX),
  message: {
    error: 'Too Many Requests',
    message: 'Too many account creation attempts from this network. Please wait an hour before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate Limiter for OTP Generation / Resends (Signup & Password Reset):
 * Attempts per RATE_LIMIT_WINDOW_MINUTES per email and IP address.
 */
export const emailOtpLimiter = rateLimit({
  windowMs,
  max: getEffectiveMax(env.RATE_LIMIT_OTP_MAX),
  keyGenerator: (req) => {
    const email = (req.body?.email || '').trim().toLowerCase()
    return `otp_${req.ip}_${hashEmail(email)}`
  },
  message: {
    error: 'Too Many Requests',
    message: 'Too many code requests for this email. Please wait an hour before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate Limiter for Password Reset:
 * Attempts per RATE_LIMIT_WINDOW_MINUTES per email and IP address.
 */
export const customerPasswordResetLimiter = rateLimit({
  windowMs,
  max: getEffectiveMax(env.RATE_LIMIT_RESET_MAX),
  keyGenerator: (req) => {
    const email = (req.body?.email || '').trim().toLowerCase()
    return `reset_${req.ip}_${hashEmail(email)}`
  },
  message: {
    error: 'Too Many Requests',
    message: 'Too many password reset attempts. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * POST /api/customer-auth/signup
 * Create new customer record with hashed password, unverified email, and courier address.
 */
router.post(
  '/signup',
  customerSignupLimiter,
  signupValidator,
  validate,
  customerAuthController.signup
)

/**
 * POST /api/customer-auth/signup/verify
 * Verifies email verification OTP for newly registered customer.
 */
router.post(
  '/signup/verify',
  signupVerifyValidator,
  validate,
  customerAuthController.verifySignup
)

/**
 * POST /api/customer-auth/signup/resend
 * Resends signup verification OTP code.
 */
router.post(
  '/signup/resend',
  emailOtpLimiter,
  signupResendValidator,
  validate,
  customerAuthController.resendSignup
)

/**
 * POST /api/customer-auth/login
 * Customer email + bcrypt password authentication.
 */
router.post(
  '/login',
  customerLoginLimiter,
  loginValidator,
  validate,
  customerAuthController.login
)

/**
 * POST /api/customer-auth/password/forgot
 * Initiates forgot password flow; generates and emails password_reset OTP.
 */
router.post(
  '/password/forgot',
  emailOtpLimiter,
  forgotPasswordValidator,
  validate,
  customerAuthController.forgotPassword
)

/**
 * POST /api/customer-auth/password/verify
 * Verifies password reset OTP and returns a signed resetToken.
 */
router.post(
  '/password/verify',
  passwordVerifyValidator,
  validate,
  customerAuthController.verifyPasswordReset
)

/**
 * POST /api/customer-auth/password/reset
 * Verifies resetToken, updates password hash, and returns login token.
 */
router.post(
  '/password/reset',
  customerPasswordResetLimiter,
  passwordResetValidator,
  validate,
  customerAuthController.resetPassword
)

/**
 * GET /api/customer-auth/me
 * Retrieves current authenticated customer profile and saved delivery address.
 */
router.get(
  '/me',
  authenticateCustomer,
  customerAuthController.getMe
)

/**
 * POST /api/customer-auth/logout
 * Stateless token logout endpoint.
 */
router.post(
  '/logout',
  customerAuthController.logout
)

export default router
