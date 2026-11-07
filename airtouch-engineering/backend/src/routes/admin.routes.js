import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import env from '../config/env.js'
import requireAdmin from '../middleware/requireAdmin.js'
import contactController from '../controllers/contact.controller.js'
import adminProductController from '../controllers/adminProduct.controller.js'
import adminAnalyticsController from '../controllers/adminAnalytics.controller.js'
import {
  createProductValidator,
  updateProductValidator,
  productQueryValidator,
} from '../validators/product.validators.js'

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

// Multer memory storage configuration (Max 2 MB, JPEG/PNG/WebP only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'))
    }
  },
})

const handleImageUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File Too Large', message: 'Image must not exceed 2 MB' })
      }
      return res.status(400).json({ error: 'Upload Error', message: err.message })
    } else if (err) {
      return res.status(400).json({ error: 'Invalid File', message: err.message })
    }
    next()
  })
}

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

      const secret = env.ADMIN_JWT_SECRET || 'dev-admin-fallback-secret'
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
 * Protected by requireAdmin middleware. Returns admin identity if session is valid.
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

// ==========================================
// PROTECTED PRODUCT MANAGEMENT ENDPOINTS
// ==========================================
router.get('/products', requireAdmin, productQueryValidator, adminProductController.listProducts)
router.post('/products', requireAdmin, createProductValidator, adminProductController.createProduct)
router.patch('/products/:id', requireAdmin, updateProductValidator, adminProductController.updateProduct)
router.delete('/products/:id', requireAdmin, adminProductController.deleteProduct)
router.post('/products/:id/image', requireAdmin, handleImageUpload, adminProductController.uploadImage)

// ==========================================
// PROTECTED SALES ANALYTICS & ORDERS
// ==========================================
router.get('/analytics/summary', requireAdmin, adminAnalyticsController.getSummary)
router.get('/analytics/products', requireAdmin, adminAnalyticsController.getProductPerformance)
router.get('/analytics/categories', requireAdmin, adminAnalyticsController.getCategoryPerformance)
router.get('/analytics/trend', requireAdmin, adminAnalyticsController.getRevenueTrend)
router.get('/orders', requireAdmin, adminAnalyticsController.getOrders)

// ==========================================
// PROTECTED CONTACT MESSAGES
// ==========================================
router.get('/contact-messages', requireAdmin, contactController.listContactMessages)
router.patch('/contact-messages/:id', requireAdmin, contactController.updateContactStatus)

export default router
