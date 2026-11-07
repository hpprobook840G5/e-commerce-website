import { Navigate, Outlet } from 'react-router-dom'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'

export default function AdminRoute() {
  const { admin, adminLoading } = useAdminAuth()

  if (adminLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
          Verifying Admin Authorization...
        </p>
      </div>
    )
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}

