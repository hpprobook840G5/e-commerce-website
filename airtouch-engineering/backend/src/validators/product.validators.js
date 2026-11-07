import { body, param, query } from 'express-validator'

const ALLOWED_CATEGORIES = [
  'brakes',
  'engine',
  'chassis',
  'tyres',
  'exhaust',
  'lighting',
  'seats',
  'handlebars',
]

export const createProductValidator = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Product name must be between 2 and 120 characters'),
  body('brand')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage('Brand cannot exceed 80 characters'),
  body('category')
    .trim()
    .toLowerCase()
    .isIn(ALLOWED_CATEGORIES)
    .withMessage(`Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`),
  body('price')
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number'),
  body('mrp')
    .isFloat({ gt: 0 })
    .withMessage('MRP must be a positive number')
    .custom((mrp, { req }) => {
      const price = parseFloat(req.body.price)
      if (price && parseFloat(mrp) < price) {
        throw new Error('MRP must be greater than or equal to the selling price')
      }
      return true
    }),
  body('stock')
    .isInt({ min: 0, max: 100000 })
    .withMessage('Stock must be an integer between 0 and 100,000'),
  body('status')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['active', 'hidden'])
    .withMessage('Status must be either "active" or "hidden"'),
  body('compatibility')
    .optional()
    .isArray()
    .withMessage('Compatibility must be an array of motorcycle models'),
  body('short_description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Short description cannot exceed 500 characters'),
  body('highlights')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Highlights cannot exceed 5 bullet points'),
  body('specifications')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Specifications cannot exceed 10 key-value pairs')
    .custom((specs) => {
      if (!Array.isArray(specs)) return true
      for (const item of specs) {
        if (!item || typeof item !== 'object' || !item.label || item.value === undefined) {
          throw new Error('Each specification must have a label and a value')
        }
      }
      return true
    }),
]

export const updateProductValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Valid product ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Product name must be between 2 and 120 characters'),
  body('brand')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage('Brand cannot exceed 80 characters'),
  body('category')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(ALLOWED_CATEGORIES)
    .withMessage(`Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`),
  body('price')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number'),
  body('mrp')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('MRP must be a positive number')
    .custom((mrp, { req }) => {
      const price = req.body.price !== undefined ? parseFloat(req.body.price) : undefined
      if (price !== undefined && parseFloat(mrp) < price) {
        throw new Error('MRP must be greater than or equal to the selling price')
      }
      return true
    }),
  body('stock')
    .optional()
    .isInt({ min: 0, max: 100000 })
    .withMessage('Stock must be an integer between 0 and 100,000'),
  body('compatibility')
    .optional()
    .isArray()
    .withMessage('Compatibility must be an array of motorcycle models'),
  body('short_description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Short description cannot exceed 500 characters'),
  body('highlights')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Highlights cannot exceed 5 bullet points'),
  body('specifications')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Specifications cannot exceed 10 key-value pairs'),
  body('status')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['active', 'hidden'])
    .withMessage('Status must be either "active" or "hidden"'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
]

export const productQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
]
