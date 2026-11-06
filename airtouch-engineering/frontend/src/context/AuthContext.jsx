import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../services/supabase.js'
import { signOut as authSignOut, getMe } from '../services/auth.js'
import { getAdminSession, logoutAdmin as serviceLogoutAdmin } from '../services/adminAuth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profileComplete, setProfileComplete] = useState(null)
  const [loading, setLoading] = useState(true)

  // Separate admin session state (verified from httpOnly backend cookie)
  const [admin, setAdmin] = useState(null)
  const [adminLoading, setAdminLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await getMe()
      if (data) {
        setProfileComplete(data.profileComplete ?? null)
        return data
      }
    } catch {
      // ignore
    }
    return null
  }, [])

  // Check admin session from server
  const checkAdminSession = useCallback(async () => {
    setAdminLoading(true)
    const result = await getAdminSession()
    setAdmin(result.authenticated ? result.admin : null)
    setAdminLoading(false)
    return result
  }, [])

  useEffect(() => {
    let mounted = true

    // Check admin session once on initial load
    checkAdminSession().catch(() => {
      if (mounted) setAdminLoading(false)
    })

    if (!isSupabaseConfigured) {
      if (import.meta.env.DEV) {
        console.warn(
          '[AirTouch Auth] Supabase URL or Anon Key is missing in .env. Authentication features are disabled in dev mode.'
        )
      }
      setLoading(false)
      return
    }

    // 1. Initial customer session check
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
          if (session?.user) {
            refreshProfile()
          }
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error('[AirTouch Auth] Error fetching initial session:', err)
          setLoading(false)
        }
      })

    // 2. Subscribe once to onAuthStateChange
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        if (session?.user) {
          refreshProfile()
        } else {
          setProfileComplete(null)
        }
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [checkAdminSession, refreshProfile])

  const handleSignOut = async () => {
    try {
      await authSignOut()
      setUser(null)
      setSession(null)
      setProfileComplete(null)
    } catch (err) {
      console.error('[AirTouch Auth] Sign out error:', err)
    }
  }

  const handleAdminLogout = async () => {
    try {
      await serviceLogoutAdmin()
      setAdmin(null)
    } catch (err) {
      console.error('[AirTouch Auth] Admin sign out error:', err)
    }
  }

  const value = useMemo(
    () => ({
      user,
      session,
      profileComplete,
      refreshProfile,
      loading,
      isConfigured: isSupabaseConfigured,
      signOut: handleSignOut,
      admin,
      adminLoading,
      checkAdminSession,
      logoutAdmin: handleAdminLogout,
    }),
    [user, session, profileComplete, refreshProfile, loading, admin, adminLoading, checkAdminSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
