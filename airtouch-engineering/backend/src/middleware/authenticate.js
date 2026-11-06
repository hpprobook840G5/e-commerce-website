import { supabaseAdmin, isAuthConfigured } from '../config/supabase.js'

/**
 * Customer Authentication Middleware.
 * Verifies customer Bearer token via supabaseAdmin.auth.getUser(token).
 * Attaches req.user = { id, mobile } and req.accessToken.
 *
 * Distinct from admin middleware (requireAdmin).
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' })
  }

  const token = authHeader.split(' ')[1]?.trim()
  if (!token) {
    return res.status(401).json({ message: 'Authorization token required' })
  }

  if (!isAuthConfigured || !supabaseAdmin) {
    return res.status(503).json({ message: 'Authentication is not configured' })
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data?.user) {
      return res.status(401).json({ message: 'Invalid or expired authorization token' })
    }

    const user = data.user
    req.user = {
      id: user.id,
      email: user.email || '',
      mobile: user.phone || user.user_metadata?.phone || '',
    }
    req.accessToken = token

    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired authorization token' })
  }
}

export default authenticate
