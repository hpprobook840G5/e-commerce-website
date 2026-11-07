import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { getAdminSession, logoutAdmin as serviceLogoutAdmin } from '../services/adminAuth.js'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [adminLoading, setAdminLoading] = useState(true)

  const checkAdminSession = useCallback(async () => {
    setAdminLoading(true)
    const result = await getAdminSession()
    setAdmin(result.authenticated ? result.admin : null)
    setAdminLoading(false)
    return result
  }, [])

  useEffect(() => {
    let mounted = true
    getAdminSession()
      .then((result) => {
        if (mounted) {
          setAdmin(result.authenticated ? result.admin : null)
          setAdminLoading(false)
        }
      })
      .catch(() => {
        if (mounted) setAdminLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const logoutAdmin = useCallback(async () => {
    try {
      await serviceLogoutAdmin()
      setAdmin(null)
    } catch (err) {
      console.error('[AirTouch Admin] Admin sign out error:', err)
    }
  }, [])

  const value = useMemo(
    () => ({
      admin,
      adminLoading,
      checkAdminSession,
      logoutAdmin,
    }),
    [admin, adminLoading, checkAdminSession, logoutAdmin]
  )

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

export default AdminAuthContext
