import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Gauge } from 'lucide-react'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 animate-pulse">
          <Gauge className="w-6 h-6 animate-spin" />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
          Verifying Session...
        </p>
      </div>
    )
  }

  if (!user) {
    const nextPath = location.pathname + location.search
    return (
      <Navigate
        to={`/auth?next=${encodeURIComponent(nextPath)}`}
        replace
      />
    )
  }

  return <Outlet />
}
