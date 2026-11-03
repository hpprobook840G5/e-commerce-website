export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Authorization token required' })
  }

  // TODO: Verify JWT token with Supabase Auth (e.g. using supabase.auth.getUser(token))

  next()
}

export default authenticate

