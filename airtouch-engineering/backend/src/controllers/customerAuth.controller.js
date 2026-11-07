import CustomerAuthService from '../services/customerAuth.service.js'

/**
 * Customer Authentication Controller.
 * Thin HTTP handlers delegating to CustomerAuthService.
 * Contains zero direct database calls.
 */

export const signup = async (req, res, next) => {
  try {
    const result = await CustomerAuthService.signup(req.body)
    return res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export const verifySignup = async (req, res, next) => {
  try {
    const result = await CustomerAuthService.verifySignup(req.body)
    return res.status(200).json({
      message: 'Email verified successfully.',
      token: result.token,
      user: result.user,
    })
  } catch (err) {
    next(err)
  }
}

export const resendSignup = async (req, res, next) => {
  try {
    const result = await CustomerAuthService.resendSignupOtp(req.body)
    return res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const result = await CustomerAuthService.login(req.body)
    return res.status(200).json({
      message: 'Logged in successfully.',
      token: result.token,
      user: result.user,
    })
  } catch (err) {
    if (err.code === 'EMAIL_NOT_VERIFIED') {
      return res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        email: err.email,
        message: err.message,
      })
    }
    next(err)
  }
}

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await CustomerAuthService.forgotPassword(req.body)
    return res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export const verifyPasswordReset = async (req, res, next) => {
  try {
    const result = await CustomerAuthService.verifyPasswordResetOtp(req.body)
    return res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    const result = await CustomerAuthService.resetPassword(req.body)
    return res.status(200).json({
      message: 'Password reset successfully.',
      token: result.token,
      user: result.user,
    })
  } catch (err) {
    next(err)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const user = await CustomerAuthService.getCurrentUser(req.customer.id)
    return res.status(200).json({
      user,
    })
  } catch (err) {
    next(err)
  }
}

export const logout = async (req, res) => {
  // Stateless JWT customer auth: client removes token from storage
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  })
}

export default {
  signup,
  verifySignup,
  resendSignup,
  login,
  forgotPassword,
  verifyPasswordReset,
  resetPassword,
  getMe,
  logout,
}
