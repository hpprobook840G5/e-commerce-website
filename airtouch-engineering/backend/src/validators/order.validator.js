import { body, param } from 'express-validator'
import { validate } from '../middleware/validate.js'

export const validateCreateOrder = [
  body('orderType')
    .trim()
    .isIn(['request', 'cod', 'upi'])
    .withMessage('Order type must be one of: request, cod, upi'),

  body('items')
    .isArray({ min: 1, max: 50 })
    .withMessage('Items must be an array of 1 to 50 items'),

  body('items.*.productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required for each item'),

  body('items.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be an integer between 1 and 100'),

  body('expectedTotal')
    .isFloat({ min: 0 })
    .withMessage('Expected total must be a valid positive number'),

  body('idempotencyKey')
    .trim()
    .isLength({ min: 16, max: 64 })
    .withMessage('Idempotency key must be between 16 and 64 characters'),

  // Address validation matching sign-up rules
  body('address')
    .isObject()
    .withMessage('Shipping address is required'),

  body('address.fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be at least 2 characters'),

  body('address.mobile')
    .trim()
    .custom((val) => {
      const cleaned = val.replace(/\D/g, '')
      if (cleaned.length < 10) {
        throw new Error('Enter a valid 10-digit mobile number')
      }
      const last10 = cleaned.slice(-10)
      if (!/^[6-9]/.test(last10)) {
        throw new Error('Indian mobile numbers must begin with 6, 7, 8, or 9')
      }
      return true
    }),

  body('address.pincode')
    .trim()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Enter a valid 6-digit postal code (cannot start with 0)'),

  body('address.addressLine1')
    .trim()
    .isLength({ min: 5, max: 120 })
    .withMessage('Address Line 1 must be between 5 and 120 characters'),

  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),

  body('address.district')
    .trim()
    .notEmpty()
    .withMessage('District is required'),

  body('address.landmark')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage('Landmark cannot exceed 80 characters'),

  validate,
]

export const validatePaymentReference = [
  param('orderNumber')
    .trim()
    .notEmpty()
    .withMessage('Order number is required'),

  body('reference')
    .trim()
    .matches(/^[A-Za-z0-9\-]{6,40}$/)
    .withMessage('Payment reference must be 6 to 40 characters (letters, numbers, hyphens)'),

  validate,
]

export const validateOrderNumberParam = [
  param('orderNumber')
    .trim()
    .notEmpty()
    .withMessage('Order number is required'),

  validate,
]

export default {
  validateCreateOrder,
  validatePaymentReference,
  validateOrderNumberParam,
}
