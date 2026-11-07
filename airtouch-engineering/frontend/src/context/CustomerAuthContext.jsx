import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { customerSession } from '../services/customerSession.js'
import {
  customerSignup,
  customerVerifySignup,
  customerResendSignup,
  customerLogin,
  customerForgotPassword,
  customerVerifyPasswordReset,
  customerResetPassword,
  getCustomerMe,
  customerLogout,
  CustomerAuthError,
} from '../services/customerAuth.js'

const CustomerAuthContext = createContext(null)

export function CustomerAuthProvider({ children }) {
  const [token, setToken] = useState(() => customerSession.getToken())
  const [greetingVariant, setGreetingVariant] = useState(() => customerSession.getGreetingVariant())
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize customer session on mount
  useEffect(() => {
    let mounted = true

    async function initSession() {
      const storedToken = customerSession.getToken()
      if (!storedToken) {
        if (mounted) {
          setUser(null)
          setToken(null)
          setLoading(false)
        }
        return
      }

      try {
        const data = await getCustomerMe()
        if (mounted) {
          setUser(data.user)
          setToken(storedToken)
          setGreetingVariant(customerSession.getGreetingVariant())
          setLoading(false)
        }
      } catch {
        if (mounted) {
          customerSession.clearToken()
          setUser(null)
          setToken(null)
          setLoading(false)
        }
      }
    }

    initSession()

    return () => {
      mounted = false
    }
  }, [])

  // Login handler: sets greetingVariant to "welcome"
  const login = useCallback(async ({ email, password }) => {
    try {
      const result = await customerLogin({ email, password })
      customerSession.setToken(result.token)
      customerSession.setGreetingVariant('welcome')
      setToken(result.token)
      setUser(result.user)
      setGreetingVariant('welcome')
      return { success: true, user: result.user }
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Invalid email or password.',
        status: err.status,
        code: err.code || null,
        email: err.email || email,
      }
    }
  }, [])

  // Signup submission: triggers OTP generation (does not log user in immediately)
  const signup = useCallback(async (formData) => {
    try {
      const result = await customerSignup(formData)
      return { success: true, ...result }
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to complete registration.',
        status: err.status,
        errors: err.errors || [],
      }
    }
  }, [])

  // Verify signup OTP: logs user in and sets greetingVariant to "hello"
  const verifySignup = useCallback(async ({ email, code }) => {
    try {
      const result = await customerVerifySignup({ email, code })
      customerSession.setToken(result.token)
      customerSession.setGreetingVariant('hello')
      setToken(result.token)
      setUser(result.user)
      setGreetingVariant('hello')
      return { success: true, user: result.user }
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Invalid or expired code.',
        status: err.status,
      }
    }
  }, [])

  // Resend signup OTP
  const resendSignup = useCallback(async ({ email }) => {
    try {
      const result = await customerResendSignup({ email })
      return { success: true, message: result.message }
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to resend code.',
        status: err.status,
      }
    }
  }, [])

  // Forgot password request
  const forgotPassword = useCallback(async ({ email }) => {
    try {
      const result = await customerForgotPassword({ email })
      return { success: true, message: result.message }
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to request password reset.',
        status: err.status,
      }
    }
  }, [])

  // Verify password reset OTP
  const verifyPasswordReset = useCallback(async ({ email, code }) => {
    try {
      const result = await customerVerifyPasswordReset({ email, code })
      return { success: true, resetToken: result.resetToken }
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Invalid or expired code.',
        status: err.status,
      }
    }
  }, [])

  // Reset password: logs user in and sets greetingVariant to "welcome"
  const resetPassword = useCallback(async ({ resetToken, password, confirmPassword }) => {
    try {
      const result = await customerResetPassword({ resetToken, password, confirmPassword })
      customerSession.setToken(result.token)
      customerSession.setGreetingVariant('welcome')
      setToken(result.token)
      setUser(result.user)
      setGreetingVariant('welcome')
      return { success: true, user: result.user }
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to reset password.',
        status: err.status,
        errors: err.errors || [],
      }
    }
  }, [])

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await customerLogout()
    } finally {
      customerSession.clearToken()
      setUser(null)
      setToken(null)
      setGreetingVariant('welcome')
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      greetingVariant,
      login,
      signup,
      verifySignup,
      resendSignup,
      forgotPassword,
      verifyPasswordReset,
      resetPassword,
      logout,
    }),
    [
      user,
      token,
      loading,
      greetingVariant,
      login,
      signup,
      verifySignup,
      resendSignup,
      forgotPassword,
      verifyPasswordReset,
      resetPassword,
      logout,
    ]
  )

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext)
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider')
  }
  return context
}

export default CustomerAuthContext
