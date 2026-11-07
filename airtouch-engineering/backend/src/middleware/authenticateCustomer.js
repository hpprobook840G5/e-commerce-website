import { verifyCustomerToken } from '../utils/jwt.js'

/**
 * Middleware protecting customer endpoints.
 * Verifies Bearer JWT using CUSTOMER_JWT_SECRET.
 * Returns 401 "Please sign in again." on any failure.
 */
export const authenticateCustomer = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please sign in again.' })
  }

  const token = authHeader.split(' ')[1]?.trim()
  if (!token) {
    return res.status(401).json({ message: 'Please sign in again.' })
  }

  try {
    const decoded = verifyCustomerToken(token)
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Please sign in again.' })
    }

    req.customer = decoded
    req.token = token
    next()
  } catch (err) {
    // Log server-side only; never expose details or raw tokens
    console.warn('[Customer Auth Middleware Exception]:', err.message)
    return res.status(401).json({ message: 'Please sign in again.' })
  }
}

export default authenticateCustomer
