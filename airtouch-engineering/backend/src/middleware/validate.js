import { validationResult } from 'express-validator'

/**
 * Express-validator completion middleware.
 * If validation errors exist, halts request and returns 400 with structured field errors.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }))

    return res.status(400).json({
      message: formattedErrors[0]?.message || 'Validation failed',
      errors: formattedErrors,
    })
  }

  next()
}

export default validate

