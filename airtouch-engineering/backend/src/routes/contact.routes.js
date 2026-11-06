import { Router } from 'express'
import { body } from 'express-validator'
import rateLimit from 'express-rate-limit'
import contactController from '../controllers/contact.controller.js'

const router = Router()

/**
 * Strict Rate Limiter for public contact form submissions:
 * 5 submissions per 15 minutes per IP.
 */
const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too Many Requests',
    message: 'Too many messages. Please try again later or contact us on WhatsApp.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * POST /api/contact
 * Public inquiry submission endpoint with strict server-side validation.
 */
router.post(
  '/',
  contactRateLimiter,
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Name must be between 2 and 80 characters'),

    body('mobile')
      .trim()
      .customSanitizer((val) => {
        if (!val) return ''
        const cleaned = String(val).replace(/\D/g, '')
        if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
          return `+91${cleaned}`
        }
        if (cleaned.length === 12 && cleaned.startsWith('91') && /^91[6-9]\d{9}$/.test(cleaned)) {
          return `+${cleaned}`
        }
        return val
      })
      .custom((val) => {
        if (!/^\+91[6-9]\d{9}$/.test(val)) {
          throw new Error('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9')
        }
        return true
      }),

    body('email')
      .optional({ checkFalsy: true })
      .trim()
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(),

    body('topic')
      .trim()
      .isIn(['order_help', 'product_fitment', 'bulk_dealer', 'returns', 'other'])
      .withMessage('Please select a valid topic from the dropdown'),

    body('order_id')
      .trim()
      .custom((value, { req }) => {
        const needsOrder = ['order_help', 'returns'].includes(req.body.topic)
        if (needsOrder) {
          if (!value || !value.trim()) {
            throw new Error('Order ID is required when requesting Order Help or Returns')
          }
          if (value.length > 40) {
            throw new Error('Order ID cannot exceed 40 characters')
          }
          if (!/^[A-Za-z0-9-]+$/.test(value)) {
            throw new Error('Order ID may only contain letters, numbers, and dashes (e.g. ORD-1092)')
          }
        }
        return true
      }),

    body('message')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Message must be between 10 and 1000 characters'),
  ],
  contactController.submitContact
)

export default router

