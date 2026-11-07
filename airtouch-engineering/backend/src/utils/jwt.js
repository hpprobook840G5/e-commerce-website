import jwt from 'jsonwebtoken'
import env from '../config/env.js'

const SECRET = env.CUSTOMER_JWT_SECRET || 'airtouch-customer-auth-jwt-secret-min-32-chars-long'
const EXPIRY = '7d'

/**
 * Generate a 7-day signed JWT for an authenticated customer.
 *
 * @param {object} user - Customer user record
 * @returns {string} Signed JWT
 */
export function generateCustomerToken(user) {
  if (!user || !user.id) {
    throw new Error('User ID is required to generate customer token')
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: 'customer',
      purpose: 'customer',
    },
    SECRET,
    {
      expiresIn: EXPIRY,
    }
  )
}

/**
 * Verify a customer Bearer JWT.
 * Ensures the token is for a customer session, not a password reset.
 *
 * @param {string} token
 * @returns {object} Decoded token payload
 */
export function verifyCustomerToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required')
  }

  const decoded = jwt.verify(token, SECRET)

  if (decoded.purpose && decoded.purpose !== 'customer') {
    throw new Error('Invalid token purpose for customer session')
  }

  return decoded
}

/**
 * Generate a short-lived reset token for password reset.
 *
 * @param {string} userId - Customer User ID
 * @returns {string} Signed JWT
 */
export function generateResetToken(userId) {
  if (!userId) {
    throw new Error('User ID is required to generate reset token')
  }

  return jwt.sign(
    {
      sub: userId,
      purpose: 'password_reset',
    },
    SECRET,
    {
      expiresIn: `${env.RESET_TOKEN_MINUTES || 15}m`,
    }
  )
}

/**
 * Verify a password reset token.
 *
 * @param {string} token
 * @returns {object} Decoded reset token payload
 */
export function verifyResetToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Reset token is required')
  }

  const decoded = jwt.verify(token, SECRET)

  if (decoded.purpose !== 'password_reset' || !decoded.sub) {
    throw new Error('Invalid reset token')
  }

  return decoded
}

export default {
  generateCustomerToken,
  verifyCustomerToken,
  generateResetToken,
  verifyResetToken,
}
