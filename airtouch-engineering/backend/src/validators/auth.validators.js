import { body, param } from 'express-validator'
import { normalizeIndianMobile } from '../utils/phone.js'
import { isValidState } from '../data/indiaStates.js'
import { isValidDistrict } from '../data/indiaDistricts.js'

function stripHtml(str = '') {
  return String(str).replace(/<[^>]*>/g, '').trim()
}

/**
 * Validation chain for Email OTP Request:
 * - email: required, valid email, trimmed, lowercase, max 254 chars
 */
export const requestOtpValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email address is required')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .isLength({ max: 254 })
    .withMessage('Email address cannot exceed 254 characters'),
]

/**
 * Validation chain for Email OTP Verification:
 * - email: required, valid email, trimmed, lowercase, max 254 chars
 * - code / token: required, exactly 6 digits numeric
 */
export const verifyOtpValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email address is required')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .isLength({ max: 254 })
    .withMessage('Email address cannot exceed 254 characters'),

  body('code')
    .custom((val, { req }) => {
      const candidate = val !== undefined ? val : req.body?.token
      if (!candidate) {
        throw new Error('OTP verification code is required')
      }
      const clean = String(candidate).trim()
      if (!/^\d{6}$/.test(clean)) {
        throw new Error('OTP must be exactly 6 digits')
      }
      req.body.code = clean
      return true
    }),
]

/**
 * Validation chain for Password Login:
 * - email: required, valid email, trimmed, lowercase
 * - password: required, max 72 characters
 */
export const passwordLoginValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email address is required')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .isLength({ max: 254 })
    .withMessage('Email address cannot exceed 254 characters'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 72 })
    .withMessage('Password cannot exceed 72 characters'),
]

/**
 * Validation chain for Account Creation / Customer Profile Provisioning:
 * POST /api/auth/account
 * - fullName: required, 2–80 chars, trimmed, HTML stripped
 * - mobile: required, 10-digit Indian mobile starting 6–9 normalized to +91XXXXXXXXXX
 * - address: required object
 *   - line1: required, 5–120 chars
 *   - landmark: optional, max 80 chars
 *   - state: required, valid Indian state or UT
 *   - district: required, valid district for state (mapped to DB city column)
 *   - pincode: required, exactly 6 digits not starting with 0 (^[1-9][0-9]{5}$)
 *   - country: default/must be "India"
 */
export const accountCreationValidator = [
  body('fullName')
    .customSanitizer(stripHtml)
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Full name must be between 2 and 80 characters'),

  body('mobile')
    .notEmpty()
    .withMessage('Mobile number is required')
    .customSanitizer((val) => normalizeIndianMobile(val) || val)
    .custom((val) => {
      if (!normalizeIndianMobile(val)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number')
      }
      return true
    }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters long')
    .custom((val) => {
      if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,72}$/.test(val)) {
        throw new Error('Password must contain at least one letter and one number')
      }
      return true
    }),

  body('confirmPassword')
    .optional({ checkFalsy: true })
    .custom((val, { req }) => {
      if (val && val !== req.body.password) {
        throw new Error('Passwords do not match')
      }
      return true
    }),

  body('address')
    .notEmpty()
    .withMessage('Address object is required')
    .isObject()
    .withMessage('Address must be an object'),

  body('address.line1')
    .customSanitizer(stripHtml)
    .notEmpty()
    .withMessage('Address line 1 is required')
    .isLength({ min: 5, max: 120 })
    .withMessage('Address line 1 must be between 5 and 120 characters'),

  body('address.landmark')
    .optional({ checkFalsy: true })
    .customSanitizer(stripHtml)
    .isLength({ max: 80 })
    .withMessage('Landmark cannot exceed 80 characters'),

  body('address.state')
    .customSanitizer(stripHtml)
    .notEmpty()
    .withMessage('State is required')
    .custom((val) => {
      if (!isValidState(val)) {
        throw new Error('Please select a valid Indian state or union territory')
      }
      return true
    }),

  body('address.district')
    .customSanitizer(stripHtml)
    .custom((val, { req }) => {
      const candidate = val || req.body?.address?.city
      if (!candidate) {
        throw new Error('District is required')
      }
      const state = req.body?.address?.state
      if (!isValidDistrict(state, candidate)) {
        throw new Error('Please select a valid district for the selected state')
      }
      req.body.address.district = candidate
      req.body.address.city = candidate
      return true
    }),

  body('address.pincode')
    .trim()
    .notEmpty()
    .withMessage('Pincode is required')
    .custom((val) => {
      if (!/^[1-9][0-9]{5}$/.test(val)) {
        throw new Error('Pincode must be exactly 6 digits and cannot start with 0')
      }
      return true
    }),

  body('address.country')
    .optional({ checkFalsy: true })
    .trim()
    .custom((val, { req }) => {
      if (val && val !== 'India') {
        throw new Error('Currently we only deliver within India')
      }
      req.body.address.country = 'India'
      return true
    }),
]

/**
 * Validation chain for Updating Customer Profile / Account:
 * PATCH /api/auth/account & PATCH /api/auth/me
 * - fullName: optional, 2-80 characters, HTML stripped
 * - mobile: optional, 10-digit Indian mobile format normalized to E.164 (+91XXXXXXXXXX)
 * - email: immutable, rejected if present
 */
export const updateProfileValidator = [
  body('email').custom((val) => {
    if (val !== undefined) {
      throw new Error('Email address is permanent and cannot be modified')
    }
    return true
  }),

  body('fullName')
    .optional({ checkFalsy: true })
    .customSanitizer(stripHtml)
    .isLength({ min: 2, max: 80 })
    .withMessage('Full name must be between 2 and 80 characters'),

  // Support full_name alias
  body('full_name')
    .optional({ checkFalsy: true })
    .customSanitizer(stripHtml)
    .isLength({ min: 2, max: 80 })
    .withMessage('Full name must be between 2 and 80 characters'),

  body('mobile')
    .optional({ checkFalsy: true })
    .customSanitizer((val) => normalizeIndianMobile(val) || val)
    .custom((val) => {
      if (!val) return true
      if (!normalizeIndianMobile(val)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number')
      }
      return true
    }),
]

/**
 * Validation chain for Adding an Address:
 * POST /api/auth/addresses
 */
export const createAddressValidator = [
  body('fullName')
    .customSanitizer(stripHtml)
    .custom((val, { req }) => {
      const name = val || req.body?.full_name
      if (!name) throw new Error('Recipient full name is required')
      if (name.length < 2 || name.length > 80) {
        throw new Error('Recipient full name must be between 2 and 80 characters')
      }
      req.body.fullName = name
      return true
    }),

  body('mobile')
    .notEmpty()
    .withMessage('Mobile number is required')
    .customSanitizer((val) => normalizeIndianMobile(val) || val)
    .custom((val) => {
      if (!normalizeIndianMobile(val)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number')
      }
      return true
    }),

  body('line1')
    .customSanitizer(stripHtml)
    .notEmpty()
    .withMessage('Address line 1 is required')
    .isLength({ min: 5, max: 120 })
    .withMessage('Address line 1 must be between 5 and 120 characters'),

  body('landmark')
    .optional({ checkFalsy: true })
    .customSanitizer(stripHtml)
    .isLength({ max: 80 })
    .withMessage('Landmark cannot exceed 80 characters'),

  body('state')
    .customSanitizer(stripHtml)
    .notEmpty()
    .withMessage('State is required')
    .custom((val) => {
      if (!isValidState(val)) {
        throw new Error('Please select a valid Indian state or union territory')
      }
      return true
    }),

  body('district')
    .customSanitizer(stripHtml)
    .custom((val, { req }) => {
      const candidate = val || req.body?.city
      if (!candidate) {
        throw new Error('District is required')
      }
      const state = req.body?.state
      if (!isValidDistrict(state, candidate)) {
        throw new Error('Please select a valid district for the selected state')
      }
      req.body.district = candidate
      req.body.city = candidate
      return true
    }),

  body('pincode')
    .trim()
    .notEmpty()
    .withMessage('Pincode is required')
    .custom((val) => {
      if (!/^[1-9][0-9]{5}$/.test(val)) {
        throw new Error('Pincode must be exactly 6 digits and cannot start with 0')
      }
      return true
    }),

  body('country')
    .optional({ checkFalsy: true })
    .trim()
    .custom((val, { req }) => {
      if (val && val !== 'India') {
        throw new Error('Currently we only deliver within India')
      }
      req.body.country = 'India'
      return true
    }),

  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be a boolean'),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
]

/**
 * Validation chain for Updating an Address:
 * PATCH /api/auth/addresses/:id
 */
export const updateAddressValidator = [
  param('id')
    .notEmpty()
    .withMessage('Address ID is required'),

  body('fullName')
    .optional({ checkFalsy: true })
    .customSanitizer(stripHtml)
    .isLength({ min: 2, max: 80 })
    .withMessage('Full name must be between 2 and 80 characters'),

  body('full_name')
    .optional({ checkFalsy: true })
    .customSanitizer(stripHtml)
    .isLength({ min: 2, max: 80 })
    .withMessage('Full name must be between 2 and 80 characters'),

  body('mobile')
    .optional({ checkFalsy: true })
    .customSanitizer((val) => normalizeIndianMobile(val) || val)
    .custom((val) => {
      if (!val) return true
      if (!normalizeIndianMobile(val)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number')
      }
      return true
    }),

  body('line1')
    .optional({ checkFalsy: true })
    .customSanitizer(stripHtml)
    .isLength({ min: 5, max: 120 })
    .withMessage('Address line 1 must be between 5 and 120 characters'),

  body('landmark')
    .optional({ checkFalsy: true })
    .customSanitizer(stripHtml)
    .isLength({ max: 80 })
    .withMessage('Landmark cannot exceed 80 characters'),

  body('state')
    .optional({ checkFalsy: true })
    .customSanitizer(stripHtml)
    .custom((val) => {
      if (!isValidState(val)) {
        throw new Error('Please select a valid Indian state or union territory')
      }
      return true
    }),

  body('district')
    .optional({ checkFalsy: true })
    .customSanitizer(stripHtml)
    .custom((val, { req }) => {
      const candidate = val || req.body?.city
      if (!candidate) return true
      const state = req.body?.state
      if (state && !isValidDistrict(state, candidate)) {
        throw new Error('Please select a valid district for the selected state')
      }
      req.body.district = candidate
      req.body.city = candidate
      return true
    }),

  body('city')
    .optional({ checkFalsy: true })
    .customSanitizer(stripHtml)
    .custom((val, { req }) => {
      if (!req.body.district && val) {
        req.body.district = val
      }
      return true
    }),

  body('pincode')
    .optional({ checkFalsy: true })
    .trim()
    .custom((val) => {
      if (!/^[1-9][0-9]{5}$/.test(val)) {
        throw new Error('Pincode must be exactly 6 digits and cannot start with 0')
      }
      return true
    }),

  body('country')
    .optional({ checkFalsy: true })
    .trim()
    .custom((val, { req }) => {
      if (val && val !== 'India') {
        throw new Error('Currently we only deliver within India')
      }
      req.body.country = 'India'
      return true
    }),

  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be a boolean'),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
]

export default {
  requestOtpValidator,
  verifyOtpValidator,
  passwordLoginValidator,
  accountCreationValidator,
  updateProfileValidator,
  createAddressValidator,
  updateAddressValidator,
}
