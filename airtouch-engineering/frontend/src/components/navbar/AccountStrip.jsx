import { Link, useLocation } from 'react-router-dom'
import { User, Package, Heart } from 'lucide-react'
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx'
import { useFavouritesStore } from '../../store/favouritesStore.js'

/**
 * AccountStrip component displayed directly below the main navigation bar on the homepage.
 * Compact (~40px) secondary bar providing quick account access, order status, and favourites.
 */
export default function AccountStrip() {
  const location = useLocation()
  const { user, loading, greetingVariant } = useCustomerAuth()
  const favourites = useFavouritesStore((state) => state.favourites)
  const favCount = favourites?.length || 0

  // Only render on the homepage
  if (location.pathname !== '/') {
    return null
  }

  // Derive first name from user fullName. Never fall back to email.
  const getFirstName = () => {
    const fullName = user?.fullName || ''
    if (fullName.trim()) {
      return fullName.trim().split(/\s+/)[0]
    }
    return 'Customer'
  }

  const isLoggedIn = Boolean(user && !loading)
  const greetingWord = greetingVariant === 'welcome' ? 'Welcome' : 'Hello'

  return (
    <nav
      aria-label="Account quick access"
      className="w-full bg-zinc-950/95 border-t border-zinc-900 backdrop-blur-sm transition-colors"
    >
      <div className="max-w-7xl mx-auto h-10 px-4 sm:px-6 lg:px-8 flex items-center justify-start sm:justify-end overflow-x-auto scrollbar-none">
        <ul className="flex items-center shrink-0 divide-x divide-zinc-800 text-xs font-medium tracking-wide">
          {/* Account link */}
          <li className="pr-3.5">
            {isLoggedIn ? (
              <Link
                to="/account"
                className="flex items-center gap-1.5 text-zinc-300 hover:text-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded px-1.5 py-1 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>
                  {greetingWord}, <span className="font-semibold text-white">{getFirstName()}</span>
                </span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 text-zinc-300 hover:text-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded px-1.5 py-1 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>
                  Hello, <span className="font-semibold text-white">Sign in</span>
                </span>
              </Link>
            )}
          </li>

          {/* Orders link */}
          <li className="px-3.5">
            <Link
              to={isLoggedIn ? '/orders' : '/auth?next=/orders'}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded px-1.5 py-1 transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>My Orders</span>
            </Link>
          </li>

          {/* Favourites link */}
          <li className="pl-3.5">
            <Link
              to={isLoggedIn ? '/favourites' : '/auth?next=/favourites'}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500 rounded px-1.5 py-1 transition-colors"
            >
              <Heart
                className={`w-3.5 h-3.5 shrink-0 ${
                  favCount > 0
                    ? 'text-orange-500 fill-orange-500'
                    : 'text-zinc-400'
                }`}
              />
              <span>Favourites</span>
              {favCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold leading-none bg-orange-500 text-zinc-950 rounded-full shadow-sm">
                  {favCount}
                </span>
              )}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}
