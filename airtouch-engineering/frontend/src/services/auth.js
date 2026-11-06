import { supabase, isSupabaseConfigured } from './supabase.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Masks an email for display: "u***r@domain.com"
 */
export function maskEmail(email = '') {
  if (!email || typeof email !== 'string' || !email.includes('@')) return email
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`
  }
  return `${local[0]}${'*'.repeat(Math.min(5, Math.max(1, local.length - 2)))}${local.slice(-1)}@${domain}`
}

/**
 * Normalizes an Indian mobile number to E.164 (+91XXXXXXXXXX) format.
 * Used for optional profile contact phone.
 */
export function normalizeIndianPhoneNumber(input = '') {
  if (!input) return null
  const cleaned = String(input).trim().replace(/[\s\-()]/g, '')
  let ten = ''

  if (cleaned.startsWith('+91')) {
    ten = cleaned.slice(3)
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    ten = cleaned.slice(2)
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    ten = cleaned.slice(1)
  } else if (cleaned.length === 10) {
    ten = cleaned
  } else {
    return null
  }

  if (/^[6-9]\d{9}$/.test(ten)) {
    return `+91${ten}`
  }
  return null
}

/**
 * Requests an Email OTP via the backend Express auth router.
 *
 * @param {string} email
 */
export async function sendOtp(email) {
  try {
    const res = await fetch(`${API_BASE}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email).trim().toLowerCase() }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        data: null,
        error: new Error(data.message || 'Failed to send OTP code. Please try again.'),
      }
    }

    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: new Error('Unable to connect to authentication server. Please check your connection.'),
    }
  }
}

/**
 * Verifies Email OTP code and synchronizes session with local Supabase client.
 *
 * @param {string} email
 * @param {string} token
 */
export async function verifyOtp(email, token) {
  try {
    const res = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: String(email).trim().toLowerCase(),
        token: String(token).trim(),
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        data: null,
        error: new Error(data.message || 'Invalid or expired verification code.'),
      }
    }

    // Synchronize Supabase JS client session
    if (data.session?.accessToken && data.session?.refreshToken) {
      try {
        await supabase.auth.setSession({
          access_token: data.session.accessToken,
          refresh_token: data.session.refreshToken,
        })
      } catch (e) {
        console.warn('[Supabase client setSession warning]:', e)
      }
    }

    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: new Error('Network error verifying code. Please try again.'),
    }
  }
}

/**
 * Initiates Google OAuth by requesting authorization URL from Express backend
 * and redirecting the browser window.
 *
 * @param {string} redirectTo
 */
export async function signInWithGoogle(redirectTo) {
  try {
    const query = redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''
    const res = await fetch(`${API_BASE}/auth/google/start${query}`, {
      headers: { Accept: 'application/json' },
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok || !data.url) {
      // Fallback: direct Supabase Client OAuth if backend route not reachable
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
          },
        })
        return { error }
      }
      return { error: new Error(data.message || 'Google sign-in is currently unavailable.') }
    }

    window.location.href = data.url
    return { error: null }
  } catch (err) {
    return { error: err }
  }
}

/**
 * Authenticates user with Email + Password via backend.
 *
 * @param {string} email
 * @param {string} password
 */
export async function signInWithEmailPassword(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: String(email).trim().toLowerCase(),
        password,
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        data: null,
        error: new Error(data.message || 'Invalid email or password.'),
      }
    }

    if (data.session?.accessToken && data.session?.refreshToken) {
      try {
        await supabase.auth.setSession({
          access_token: data.session.accessToken,
          refresh_token: data.session.refreshToken,
        })
      } catch (e) {
        console.warn('[Supabase client setSession warning]:', e)
      }
    }

    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: new Error('Network error signing in. Please try again.'),
    }
  }
}

/**
 * Ensures user profile is provisioned on the backend after Google OAuth callback.
 *
 * @param {string} accessToken
 */
export async function ensureProfile(accessToken) {
  try {
    const res = await fetch(`${API_BASE}/auth/profile/ensure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const data = await res.json().catch(() => ({}))
    return { data, error: !res.ok ? new Error(data.message) : null }
  } catch (err) {
    return { data: null, error: err }
  }
}

/**
 * Updates user profile metadata (full name, optional mobile) and/or password.
 *
 * @param {object} params - { fullName, mobile, password }
 */
export async function updateUserProfile({ fullName, mobile, password }) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    // 1. If password provided, update via Supabase auth client
    if (password && password.length >= 8) {
      await supabase.auth.updateUser({ password })
    }

    // 2. Update profile fields on backend
    if (token && (fullName !== undefined || mobile !== undefined)) {
      const payload = {}
      if (fullName !== undefined) payload.full_name = fullName
      if (mobile !== undefined) payload.mobile = mobile

      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { data: null, error: new Error(data.message || 'Failed to update profile.') }
      }
      return { data, error: null }
    }

    return { data: { message: 'Profile updated.' }, error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}

/**
 * Signs out customer from backend and local Supabase client.
 */
export async function signOut() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (token) {
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {})
    }

    await supabase.auth.signOut()
    return { error: null }
  } catch (err) {
    return { error: err }
  }
}

export async function getSession() {
  return supabase.auth.getSession()
}

/**
 * Completes customer profile and shipping address registration.
 * Calls POST /api/auth/account.
 *
 * @param {object} accountData - { fullName, mobile, password, confirmPassword, address: { line1, landmark, district, state, pincode, country } }
 */
export async function createAccount(accountData) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      return {
        data: null,
        error: new Error('Authentication session required. Please sign in again.'),
        status: 401,
      }
    }

    const res = await fetch(`${API_BASE}/auth/account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(accountData),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        data: null,
        error: new Error(data.message || 'Failed to complete profile registration.'),
        status: res.status,
        errors: data.errors,
      }
    }

    return { data, error: null, status: res.status }
  } catch (err) {
    return {
      data: null,
      error: new Error('Network error creating account. Please check your connection.'),
      status: 500,
    }
  }
}

/**
 * Retrieves full customer account details, addresses, and completeness status.
 */
export async function getAccount() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return { data: null, error: new Error('Not authenticated') }

    const res = await fetch(`${API_BASE}/auth/account`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { data: null, error: new Error(data.message) }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}

/**
 * Retrieves customer user details and profile completeness status.
 */
export async function getMe() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return { data: null, error: new Error('Not authenticated') }

    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { data: null, error: new Error(data.message) }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}

export default {
  maskEmail,
  normalizeIndianPhoneNumber,
  sendOtp,
  verifyOtp,
  signInWithGoogle,
  signInWithEmailPassword,
  ensureProfile,
  updateUserProfile,
  createAccount,
  getAccount,
  getMe,
  signOut,
  getSession,
}
