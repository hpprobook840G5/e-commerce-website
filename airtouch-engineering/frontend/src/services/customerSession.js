const TOKEN_STORAGE_KEY = 'airtouch-customer-token'
const GREETING_STORAGE_KEY = 'airtouch-customer-greeting-variant'

/**
 * Customer session storage manager.
 * Single source of truth for persisting and retrieving the customer JWT token
 * and greeting variant metadata ("hello" | "welcome").
 */
export const customerSession = {
  getToken() {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY)
    } catch {
      return null
    }
  },

  setToken(token) {
    if (typeof window === 'undefined') return
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, String(token).trim())
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
      }
    } catch (err) {
      console.warn('[customerSession] Failed to write token to localStorage:', err)
    }
  },

  clearToken() {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(GREETING_STORAGE_KEY)
    } catch (err) {
      console.warn('[customerSession] Failed to clear token from localStorage:', err)
    }
  },

  getGreetingVariant() {
    if (typeof window === 'undefined') return 'welcome'
    try {
      const val = localStorage.getItem(GREETING_STORAGE_KEY)
      return val === 'hello' ? 'hello' : 'welcome'
    } catch {
      return 'welcome'
    }
  },

  setGreetingVariant(variant) {
    if (typeof window === 'undefined') return
    try {
      const normalized = variant === 'hello' ? 'hello' : 'welcome'
      localStorage.setItem(GREETING_STORAGE_KEY, normalized)
    } catch (err) {
      console.warn('[customerSession] Failed to write greeting variant:', err)
    }
  },
}

export default customerSession
