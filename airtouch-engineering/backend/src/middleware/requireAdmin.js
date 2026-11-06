import jwt from 'jsonwebtoken'
import env from '../config/env.js'

export const requireAdmin = (req, res, next) => {
  const token = req.cookies?.admin_token

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin authentication session required',
    })
  }

  try {
    const secret = env.ADMIN_JWT_SECRET || env.JWT_SECRET || 'dev-admin-fallback-secret'
    const decoded = jwt.verify(token, secret)

    if (decoded.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      })
    }

    req.admin = decoded
    next()
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired admin session',
    })
  }
}

export default requireAdmin

