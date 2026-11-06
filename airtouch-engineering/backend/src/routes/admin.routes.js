import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import env from '../config/env.js'
import requireAdmin from '../middleware/requireAdmin.js'
import contactController from '../controllers/contact.controller.js'

const router = Router()

// Strict rate limit for admin login attempts: 5 attempts per 15 minutes per IP
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too Many Requests',
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: (env.ADMIN_SESSION_HOURS || 8) * 60 * 60 * 1000,
  path: '/',
})

/**
 * POST /api/admin/login
 * Public endpoint protected by strict IP rate-limiting.
 * Validates credentials against environment variables and sets an httpOnly session cookie.
 */
router.post(
  '/login',
  adminLoginLimiter,
  [
    body('email').trim().isEmail().withMessage('Enter a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid email or password format',
        errors: errors.array(),
      })
    }

    const { email, password } = req.body

    const configuredAdminEmail = env.ADMIN_EMAIL
    const configuredPasswordHash = env.ADMIN_PASSWORD_HASH

    if (!configuredAdminEmail || !configuredPasswordHash) {
      console.error('[Admin Auth] ADMIN_EMAIL or ADMIN_PASSWORD_HASH is missing in backend .env')
      return res.status(500).json({
        error: 'Server Misconfiguration',
        message: 'Admin authentication is not configured on the server.',
      })
    }

    // Generic error response to prevent account enumeration
    const genericFailure = () =>
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      })

    if (email.toLowerCase() !== configuredAdminEmail.toLowerCase()) {
      return genericFailure()
    }

    try {
      const isMatch = await bcrypt.compare(password, configuredPasswordHash)
      if (!isMatch) {
        return genericFailure()
      }

      const secret = env.ADMIN_JWT_SECRET || env.JWT_SECRET || 'dev-admin-fallback-secret'
      const sessionHours = env.ADMIN_SESSION_HOURS || 8

      const token = jwt.sign(
        {
          email: configuredAdminEmail,
          role: 'admin',
        },
        secret,
        {
          expiresIn: `${sessionHours}h`,
        }
      )

      res.cookie('admin_token', token, getCookieOptions())

      return res.json({
        success: true,
        message: 'Admin authenticated successfully',
        admin: {
          email: configuredAdminEmail,
          role: 'admin',
        },
      })
    } catch (err) {
      console.error('[Admin Auth] Error during password verification:', err)
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected authentication error occurred.',
      })
    }
  }
)

/**
 * POST /api/admin/logout
 * Clears the httpOnly admin session cookie.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
  })

  return res.json({
    success: true,
    message: 'Admin logged out successfully',
  })
})

/**
 * GET /api/admin/me
 * Protected by requireAdmin middleware. Returns admin session profile if valid.
 */
router.get('/me', requireAdmin, (req, res) => {
  return res.json({
    authenticated: true,
    admin: {
      email: req.admin.email,
      role: req.admin.role,
    },
  })
})

/**
 * Example protected admin resource endpoint
 */
router.get('/dashboard-stats', requireAdmin, (req, res) => {
  return res.json({
    message: 'Admin dashboard metrics',
    admin: req.admin.email,
    stats: {
      totalProducts: 8,
      activeOrders: 0,
      systemHealth: 'Optimal',
    },
  })
})

/**
 * GET /api/admin/contact-messages
 * Protected: Paginated customer inquiries with optional status/topic filters.
 */
router.get('/contact-messages', requireAdmin, contactController.listContactMessages)

/**
 * PATCH /api/admin/contact-messages/:id
 * Protected: Update status of a customer inquiry.
 */
router.patch('/contact-messages/:id', requireAdmin, contactController.updateContactStatus)

export default router
