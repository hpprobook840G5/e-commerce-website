import { customerSession } from './customerSession.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export class CustomerAuthError extends Error {
  constructor(message, status = 500, errors = [], code = null, email = null) {
    super(message)
    this.name = 'CustomerAuthError'
    this.status = status
    this.errors = errors
    this.code = code
    this.email = email
  }
}

/**
 * Register a new customer via POST /api/customer-auth/signup.
 * Returns { status: "verification_required", email }.
 */
export async function customerSignup(payload) {
  try {
    const res = await fetch(`${API_BASE}/customer-auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new CustomerAuthError(
        data.message || 'Failed to create account. Please try again.',
        res.status,
        data.errors || []
      )
    }

    return data
  } catch (err) {
    if (err instanceof CustomerAuthError) throw err
    throw new CustomerAuthError(
      'Unable to connect to authentication server. Please check your connection.',
      500
    )
  }
}

/**
 * Verify signup OTP via POST /api/customer-auth/signup/verify.
 * Returns { token, user }.
 */
export async function customerVerifySignup({ email, code }) {
  try {
    const res = await fetch(`${API_BASE}/customer-auth/signup/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email).trim().toLowerCase(), code }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new CustomerAuthError(
        data.message || 'Invalid or expired code.',
        res.status,
        data.errors || []
      )
    }

    return data
  } catch (err) {
    if (err instanceof CustomerAuthError) throw err
    throw new CustomerAuthError(
      'Unable to connect to verification server. Please try again.',
      500
    )
  }
}

/**
 * Resend signup verification OTP via POST /api/customer-auth/signup/resend.
 */
export async function customerResendSignup({ email }) {
  try {
    const res = await fetch(`${API_BASE}/customer-auth/signup/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email).trim().toLowerCase() }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new CustomerAuthError(
        data.message || 'Failed to resend code. Please try again later.',
        res.status
      )
    }

    return data
  } catch (err) {
    if (err instanceof CustomerAuthError) throw err
    throw new CustomerAuthError(
      'Unable to connect to server. Please try again.',
      500
    )
  }
}

/**
 * Authenticate customer via POST /api/customer-auth/login.
 * Returns { token, user } on success.
 * Throws CustomerAuthError with code: 'EMAIL_NOT_VERIFIED' if unverified.
 */
export async function customerLogin({ email, password }) {
  try {
    const res = await fetch(`${API_BASE}/customer-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email).trim().toLowerCase(), password }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      if (res.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
        throw new CustomerAuthError(
          data.message || 'Please verify your email address to continue.',
          403,
          [],
          'EMAIL_NOT_VERIFIED',
          data.email || email
        )
      }
      throw new CustomerAuthError(
        data.message || 'Invalid email or password.',
        res.status,
        data.errors || []
      )
    }

    return data
  } catch (err) {
    if (err instanceof CustomerAuthError) throw err
    throw new CustomerAuthError(
      'Unable to connect to authentication server. Please check your connection.',
      500
    )
  }
}

/**
 * Request password reset OTP via POST /api/customer-auth/password/forgot.
 */
export async function customerForgotPassword({ email }) {
  try {
    const res = await fetch(`${API_BASE}/customer-auth/password/forgot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email).trim().toLowerCase() }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new CustomerAuthError(
        data.message || 'Unable to process password reset request.',
        res.status,
        data.errors || []
      )
    }

    return data
  } catch (err) {
    if (err instanceof CustomerAuthError) throw err
    throw new CustomerAuthError(
      'Unable to connect to password reset server. Please try again.',
      500
    )
  }
}

/**
 * Verify password reset OTP via POST /api/customer-auth/password/verify.
 * Returns { resetToken }.
 */
export async function customerVerifyPasswordReset({ email, code }) {
  try {
    const res = await fetch(`${API_BASE}/customer-auth/password/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email).trim().toLowerCase(), code }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new CustomerAuthError(
        data.message || 'Invalid or expired code.',
        res.status,
        data.errors || []
      )
    }

    return data
  } catch (err) {
    if (err instanceof CustomerAuthError) throw err
    throw new CustomerAuthError(
      'Unable to connect to verification server. Please try again.',
      500
    )
  }
}

/**
 * Set new password via POST /api/customer-auth/password/reset.
 * Returns { token, user }.
 */
export async function customerResetPassword({ resetToken, password, confirmPassword }) {
  try {
    const res = await fetch(`${API_BASE}/customer-auth/password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, password, confirmPassword }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new CustomerAuthError(
        data.message || 'Failed to reset password.',
        res.status,
        data.errors || []
      )
    }

    return data
  } catch (err) {
    if (err instanceof CustomerAuthError) throw err
    throw new CustomerAuthError(
      'Unable to connect to server. Please try again.',
      500
    )
  }
}

/**
 * Retrieve authenticated customer profile via GET /api/customer-auth/me.
 *
 * @returns {Promise<{ user: object }>}
 */
export async function getCustomerMe() {
  const token = customerSession.getToken()
  if (!token) {
    throw new CustomerAuthError('No active customer session', 401)
  }

  try {
    const res = await fetch(`${API_BASE}/customer-auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      if (res.status === 401) {
        customerSession.clearToken()
      }
      throw new CustomerAuthError(
        data.message || 'Please sign in again.',
        res.status
      )
    }

    return data
  } catch (err) {
    if (err instanceof CustomerAuthError) throw err
    throw new CustomerAuthError(
      'Failed to load customer profile. Please try again.',
      500
    )
  }
}

/**
 * Invalidate customer session via POST /api/customer-auth/logout.
 */
export async function customerLogout() {
  const token = customerSession.getToken()
  customerSession.clearToken()

  if (token) {
    try {
      await fetch(`${API_BASE}/customer-auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      // Stateless token logout: client cleared token already
    }
  }

  return { success: true }
}

export default {
  customerSignup,
  customerVerifySignup,
  customerResendSignup,
  customerLogin,
  customerForgotPassword,
  customerVerifyPasswordReset,
  customerResetPassword,
  getCustomerMe,
  customerLogout,
}
