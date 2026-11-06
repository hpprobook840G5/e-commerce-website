const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Admin Authentication Service
 * Communicates with backend Express admin endpoints using httpOnly cookies (credentials: 'include').
 * Token is NEVER stored in localStorage or exposed to JavaScript.
 */

export async function loginAdmin(email, password) {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        success: false,
        error: data.message || 'Invalid email or password',
      }
    }

    return {
      success: true,
      admin: data.admin,
    }
  } catch (err) {
    return {
      success: false,
      error: 'Unable to reach the authentication server. Please ensure the backend is running.',
    }
  }
}

export async function logoutAdmin() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    return { success: res.ok }
  } catch (err) {
    return { success: false }
  }
}

export async function getAdminSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/me`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!res.ok) {
      return { authenticated: false, admin: null }
    }

    const data = await res.json().catch(() => ({}))
    return {
      authenticated: Boolean(data.authenticated),
      admin: data.admin || null,
    }
  } catch (err) {
    return { authenticated: false, admin: null }
  }
}

