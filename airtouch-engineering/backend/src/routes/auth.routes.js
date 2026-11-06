import { Router } from 'express'
import authController from '../controllers/auth.controller.js'
import {
  requestOtpValidator,
  verifyOtpValidator,
  passwordLoginValidator,
  updateProfileValidator,
  accountCreationValidator,
  createAddressValidator,
  updateAddressValidator,
} from '../validators/auth.validators.js'
import validate from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import {
  otpRequestEmailLimiter,
  otpRequestIpLimiter,
  otpVerifyLimiter,
  passwordLoginLimiter,
} from '../middleware/rateLimiters.js'
import { isAuthConfigured } from '../config/supabase.js'
import { isOtpConfigured } from '../config/env.js'

const router = Router()

/**
 * Global router check: if Supabase keys are missing, return 503 Service Unavailable
 * gracefully instead of crashing the server process.
 */
router.use((req, res, next) => {
  if (!isAuthConfigured) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Authentication is not configured',
    })
  }
  next()
})

/**
 * Middleware check specifically for Nodemailer OTP routes.
 * Returns 503 "Email sign-in is not configured" if SMTP or OTP_HMAC_SECRET is missing.
 */
const requireOtpConfig = (req, res, next) => {
  if (!isOtpConfigured) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Email sign-in is not configured',
    })
  }
  next()
}

/**
 * POST /api/auth/otp/request
 * Validates email, checks OTP config, applies rate limits, generates Nodemailer OTP.
 * Always returns 200 { message: "If that email is valid, a code has been sent." }
 */
router.post(
  '/otp/request',
  requestOtpValidator,
  validate,
  requireOtpConfig,
  otpRequestIpLimiter,
  otpRequestEmailLimiter,
  authController.requestOtp
)

/**
 * POST /api/auth/otp/verify
 * Validates 6-digit OTP code, checks OTP config, applies rate limits, constant-time HMAC check, issues session.
 */
router.post(
  '/otp/verify',
  verifyOtpValidator,
  validate,
  requireOtpConfig,
  otpVerifyLimiter,
  authController.verifyOtp
)

/**
 * POST /api/auth/account
 * Provision customer account profile and default shipping address for courier delivery.
 */
router.post(
  '/account',
  authenticate,
  accountCreationValidator,
  validate,
  authController.createAccount
)

/**
 * GET /api/auth/account
 * Retrieve customer account profile and address information.
 */
router.get(
  '/account',
  authenticate,
  authController.getAccount
)

/**
 * PATCH /api/auth/account
 * Update customer fullName and/or mobile. Email is immutable.
 */
router.patch(
  '/account',
  authenticate,
  updateProfileValidator,
  validate,
  authController.updateAccount
)

/**
 * GET /api/auth/addresses
 * List all delivery addresses belonging to the authenticated customer.
 */
router.get(
  '/addresses',
  authenticate,
  authController.listAddresses
)

/**
 * POST /api/auth/addresses
 * Add a new delivery address with duplicate prevention and default re-assignment.
 */
router.post(
  '/addresses',
  authenticate,
  createAddressValidator,
  validate,
  authController.createAddress
)

/**
 * PATCH /api/auth/addresses/:id
 * Update an existing delivery address belonging to the authenticated customer.
 */
router.patch(
  '/addresses/:id',
  authenticate,
  updateAddressValidator,
  validate,
  authController.updateAddress
)

/**
 * DELETE /api/auth/addresses/:id
 * Delete an existing delivery address belonging to the authenticated customer.
 */
router.delete(
  '/addresses/:id',
  authenticate,
  authController.deleteAddress
)

/**
 * GET /api/auth/google/start
 * Generates Google OAuth authorization URL with allowlisted redirect destination.
 */
router.get(
  '/google/start',
  authController.startGoogle
)

/**
 * POST /api/auth/profile/ensure
 * Authenticated endpoint called after Google OAuth to ensure profile row exists.
 */
router.post(
  '/profile/ensure',
  authenticate,
  authController.ensureProfile
)

/**
 * POST /api/auth/login/password
 * Email + password login, rate-limited on failed attempts.
 */
router.post(
  '/login/password',
  passwordLoginLimiter,
  passwordLoginValidator,
  validate,
  authController.passwordLogin
)

/**
 * POST /api/auth/logout
 * Revokes current customer session in Supabase.
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
)

/**
 * GET /api/auth/me
 * Retrieves current authenticated customer profile and user details.
 */
router.get(
  '/me',
  authenticate,
  authController.getMe
)

/**
 * PATCH /api/auth/me
 * Updates full_name and optional mobile on customer profile. Rejects email changes.
 */
router.patch(
  '/me',
  authenticate,
  updateProfileValidator,
  validate,
  authController.updateMe
)

export default router
