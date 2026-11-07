import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Heart,
  LogOut,
  ArrowRight,
  Gauge,
  ShieldCheck,
  Calendar,
  Clock,
} from 'lucide-react'
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx'
import { useFavouritesStore } from '../../store/favouritesStore.js'

export default function Account() {
  const navigate = useNavigate()
  const { user, loading, logout, greetingVariant } = useCustomerAuth()
  const favourites = useFavouritesStore((state) => state.favourites)
  const favCount = favourites?.length || 0

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?next=/account', { replace: true })
    }
  }, [user, loading, navigate])

  const handleSignOut = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  // 1. Loading Skeleton
  if (loading) {
    return (
      <main className="min-h-[75vh] flex flex-col items-center justify-center bg-zinc-950 px-4 py-16">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 mb-4 animate-pulse">
          <Gauge className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
          Loading Customer Dashboard...
        </p>
      </main>
    )
  }

  // If user is not yet available, wait for effect redirect
  if (!user) {
    return null
  }

  const fullName = user.fullName || 'Customer'
  const firstName = fullName.trim().split(/\s+/)[0] || 'Customer'

  const formatDate = (isoString) => {
    if (!isoString) return 'Not recorded'
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <main className="min-h-[80vh] bg-zinc-950 text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30">
                <ShieldCheck className="w-3 h-3" />
                Verified Customer
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {greetingVariant === 'welcome' ? 'Welcome' : 'Hello'}, <span className="text-orange-500">{firstName}</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Manage your customer profile, default courier address, and vehicle parts orders.
            </p>
          </div>

          <button
            type="button"
            data-testid="account-logout-button"
            onClick={handleSignOut}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-zinc-400" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Action Shortcuts: My Orders & Favourites */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/orders"
            className="group p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-orange-500/40 transition-all flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                  My Orders
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Track shipment status, courier dispatch, and past parts
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/favourites"
            className="group p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-orange-500/40 transition-all flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                    Favourites
                  </h3>
                  {favCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {favCount} saved
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Saved performance components and garage wishlist
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* Profile & Courier Address Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Profile Card */}
          <section
            aria-labelledby="profile-heading"
            className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl space-y-4"
          >
            <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
              <User className="w-4 h-4 text-orange-500" />
              <h2 id="profile-heading" className="text-xs font-black uppercase tracking-wider text-zinc-200">
                Personal Information
              </h2>
            </div>

            <dl className="space-y-3.5 text-xs">
              <div>
                <dt className="text-zinc-500 font-semibold mb-0.5">Full Name</dt>
                <dd className="text-sm font-bold text-white">{user.fullName}</dd>
              </div>

              <div>
                <dt className="text-zinc-500 font-semibold mb-0.5">Email Address</dt>
                <dd className="text-sm font-mono text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{user.email}</span>
                </dd>
              </div>

              <div>
                <dt className="text-zinc-500 font-semibold mb-0.5">Contact Mobile</dt>
                <dd className="text-sm font-mono text-zinc-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{user.mobile}</span>
                </dd>
              </div>

              <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <dt className="text-zinc-500 font-semibold mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Member Since</span>
                  </dt>
                  <dd className="text-xs font-mono text-zinc-400">
                    {formatDate(user.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500 font-semibold mb-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Last Login</span>
                  </dt>
                  <dd className="text-xs font-mono text-zinc-400">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Current session'}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          {/* Courier Delivery Address Card */}
          <section
            aria-labelledby="address-heading"
            className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl space-y-4"
          >
            <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
              <MapPin className="w-4 h-4 text-orange-500" />
              <h2 id="address-heading" className="text-xs font-black uppercase tracking-wider text-zinc-200">
                Default Courier Address
              </h2>
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{user.fullName}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  Primary Delivery
                </span>
              </div>
              <p className="text-zinc-400 font-mono text-[11px]">{user.mobile}</p>

              <div className="pt-2 border-t border-zinc-800/60 text-zinc-300 space-y-1">
                <div>
                  <span className="text-zinc-500 text-[11px] block">Address Line 1:</span>
                  <p className="text-white font-medium">{user.addressLine1}</p>
                </div>

                {user.landmark && (
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Landmark:</span>
                    <p className="text-zinc-300">{user.landmark}</p>
                  </div>
                )}

                <div className="pt-1">
                  <span className="text-zinc-500 text-[11px] block">District &amp; State:</span>
                  <p className="font-semibold text-white">
                    {user.district}, {user.state}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Postal Code:</span>
                    <p className="font-mono text-orange-400 font-bold">{user.pincode}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Country:</span>
                    <p className="text-zinc-300 uppercase font-semibold">{user.country || 'India'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
