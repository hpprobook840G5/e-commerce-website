import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  LogOut,
  ArrowLeft,
  Package,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  KeyRound,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import ContactMessagesTable from '../../components/admin/ContactMessagesTable.jsx'

export default function Admin() {
  const { admin, logoutAdmin } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logoutAdmin()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-orange-500 selection:text-black">
      {/* Top Admin Bar */}
      <header className="border-b border-zinc-850 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/40 flex items-center justify-center text-orange-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider uppercase flex items-center">
                AirTouch <span className="text-orange-500 ml-1">Admin</span>
              </span>
              <span className="block text-[9px] uppercase tracking-widest text-zinc-400 font-semibold -mt-0.5">
                Internal Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              data-testid="admin-logout-button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-orange-500/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider mb-3">
                <CheckCircle2 className="w-3 h-3" />
                <span>Authorized Session</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-white">
                Admin Control Center
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Logged in as <strong className="text-zinc-200">{admin?.email}</strong> with full
                catalog and inventory administration privileges.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-left">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Session Token
                </p>
                <p className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  httpOnly Cookie
                </p>
              </div>
              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-left">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Role
                </p>
                <p className="text-xs font-bold uppercase text-orange-400 mt-0.5">
                  {admin?.role || 'Administrator'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Catalog</span>
              <Package className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-black text-white">8 Parts</p>
            <p className="text-[11px] text-zinc-500 mt-1">High-performance motorcycle spares</p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Security State</span>
              <KeyRound className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400">Strict</p>
            <p className="text-[11px] text-zinc-500 mt-1">bcrypt (12 rounds) + JWT cookie</p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Rate Limiter</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white">Active</p>
            <p className="text-[11px] text-zinc-500 mt-1">5 login attempts / 15 minutes</p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Session Lifespan</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">8 Hours</p>
            <p className="text-[11px] text-zinc-500 mt-1">Configurable via ADMIN_SESSION_HOURS</p>
          </div>
        </div>

        {/* Customer Contact Inquiries Management */}
        <ContactMessagesTable />

        {/* Administration Info & Next Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-orange-500 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Catalog & Inventory Quick Reference</span>
            </h2>
            <div className="space-y-3">
              {[
                { name: 'Dual-Channel ABS Control Unit', partNo: 'ABS-MOD-7721', stock: 'In Stock' },
                { name: 'Forged Carbon Monobloc Brake Caliper', partNo: 'BRK-MONO-402', stock: 'In Stock' },
                { name: 'Titanium Slip-On Exhaust System', partNo: 'EXH-TI-991', stock: 'In Stock' },
                { name: '4-Row High-Efficiency Oil Cooler', partNo: 'CLR-OIL-400', stock: 'In Stock' },
              ].map((item) => (
                <div
                  key={item.partNo}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-850 text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{item.partNo}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {item.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-orange-500 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Environment Configuration</span>
            </h2>
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-500">ADMIN_EMAIL</span>
                <span className="text-zinc-300">{admin?.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-500">PASSWORD HASH</span>
                <span className="text-emerald-400">Configured in backend .env</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-500">COOKIE POLICY</span>
                <span className="text-zinc-300">httpOnly, SameSite=Strict/Lax</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">TOKEN STORAGE</span>
                <span className="text-zinc-300">Cookie only (Zero LocalStorage)</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
              To rotate master admin credentials, execute{' '}
              <code className="text-orange-400 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-800">
                node backend/scripts/hash-admin-password.js &lt;new-password&gt;
              </code>{' '}
              and update the backend environment file.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
