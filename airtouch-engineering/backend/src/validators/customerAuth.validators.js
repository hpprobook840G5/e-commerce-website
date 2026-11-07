import { body } from 'express-validator'
import { isValidState } from '../data/indiaStates.js'

function stripHtml(str = '') {
  return String(str).replace(/<[^>]*>/g, '').trim()
}

export function normalizeIndianMobile(input = '') {
  if (!input) return null
  const cleaned = String(input).trim().replace(/[\s\-()]/g, '')
  let ten = ''

  if (cleaned.startsWith('+91')) {
    ten = cleaned.slice(3)
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    ten = cleaned.slice(2)
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    ten = cleaned.slice(1)
  } else if (cleaned.length === 10) {
    ten = cleaned
  } else {
    return null
  }

  if (/^[6-9]\d{9}$/.test(ten)) {
    return `+91${ten}`
  }
  return null
}

export const signupValidator = [
  body('fullName')
    .customSanitizer(stripHtml)
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Full name must be between 2 and 80 characters'),

  body('email')
    .notEmpty()
    .withMessage('Email address is required')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .isLength({ max: 254 })
    .withMessage('Email address cannot exceed 254 characters'),

  body('mobile')
    .notEmpty()
    .withMessage('Mobile number is required')
    .customSanitizer((val) => normalizeIndianMobile(val) || val)
    .custom((val) => {
      if (!normalizeIndianMobile(val)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number starting with 6–9')
      }
      return true
    }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .custom((val) => {
      if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,72}$/.test(val)) {
        throw new Error('Password must contain at least one letter and one number')
      }
      return true
    }),

  body('confirmPassword')
    .optional({ checkFalsy: true })
    .custom((val, { req }) => {
      if (req.body.password && val !== req.body.password) {
        throw new Error('Passwords do not match')
      }
      return true
    }),

  body('addressLine1')
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

  body('district')
    .customSanitizer(stripHtml)
    .notEmpty()
    .withMessage('District is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('District must be between 2 and 60 characters'),

  body('state')
    .notEmpty()
    .withMessage('State is required')
    .trim()
    .custom((val) => {
      if (!isValidState(val)) {
        throw new Error('Please select a valid Indian State or Union Territory')
      }
      return true
    }),

  body('pincode')
    .notEmpty()
    .withMessage('Pincode is required')
    .trim()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Please enter a valid 6-digit Indian PIN code (cannot start with 0)'),

  body('country')
    .optional()
    .trim()
    .customSanitizer((val) => val || 'India'),
]

export const loginValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email address is required')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please enter a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]

export const signupVerifyValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email address is required')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please enter a valid email address'),

  body('code')
    .notEmpty()
    .withMessage('Verification code is required')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Verification code must be exactly 6 digits'),
]

export const signupResendValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email address is required')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please enter a valid email address'),
]

export const forgotPasswordValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email address is required')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please enter a valid email address'),
]

export const passwordVerifyValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email address is required')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please enter a valid email address'),

  body('code')
    .notEmpty()
    .withMessage('Verification code is required')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Verification code must be exactly 6 digits'),
]

export const passwordResetValidator = [
  body('resetToken')
    .notEmpty()
    .withMessage('Reset token is required')
    .isString()
    .withMessage('Reset token must be a string'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .custom((val) => {
      if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,72}$/.test(val)) {
        throw new Error('Password must contain at least one letter and one number')
      }
      return true
    }),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error('Passwords do not match')
      }
      return true
    }),
]

export default {
  signupValidator,
  loginValidator,
  signupVerifyValidator,
  signupResendValidator,
  forgotPasswordValidator,
  passwordVerifyValidator,
  passwordResetValidator,
}
