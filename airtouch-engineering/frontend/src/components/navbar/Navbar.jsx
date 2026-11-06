import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Gauge,
  Search,
  User,
  ShoppingCart,
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  LogOut,
  Package,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '../../store/cartStore.js'
import { useAuth } from '../../context/AuthContext.jsx'

/**
 * AirTouch Engineering - Premium Automotive Navigation Bar
 */
export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut, isConfigured, admin } = useAuth()

  // Cart state
  const items = useCartStore((state) => state.items)
  const itemCount = items.reduce((total, item) => total + (item.quantity || 1), 0)

  // Scroll hide / reveal state
  const [isVisible, setIsVisible] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)
  const searchContainerRef = useRef(null)

  // User avatar dropdown state (Desktop/Tablet)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  // Mobile menu drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Theme toggle state (defaulting to dark as per automotive brand identity)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      if (saved) return saved
      return document.documentElement.classList.contains('dark') ? 'dark' : 'dark'
    }
    return 'dark'
  })

  // Synchronize theme with DOM root class & localStorage
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Polished scroll listener with requestAnimationFrame and hysteresis
  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // At top of the page: always fully visible, no shadow
      if (currentScrollY < 60) {
        setIsVisible(true)
        setIsScrolled(false)
        ticking = false
        return
      }

      setIsScrolled(true)

      // Hysteresis threshold to prevent jitter
      const diff = currentScrollY - lastScrollY
      if (Math.abs(diff) > 8) {
        if (diff > 0 && currentScrollY > 100) {
          // Scrolling down: smoothly hide
          setIsVisible(false)
        } else if (diff < 0) {
          // Scrolling up: smoothly reveal
          setIsVisible(true)
        }
        lastScrollY = currentScrollY
      }

      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsSearchOpen(false)
      }
    }

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSearchOpen])

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isUserMenuOpen])

  // Close mobile drawer and dropdowns on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsSearchOpen(false)
    setIsUserMenuOpen(false)
  }, [location.pathname, location.hash])

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
        setIsMobileMenuOpen(false)
        setIsUserMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setIsMobileMenuOpen(false)
      setSearchQuery('')
    }
  }

  // Navigation Links definition
  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'About Us', path: '/#about', isHash: true },
    { label: 'Contact Us', path: '/contact' },
  ]

  const isLinkActive = (item) => {
    if (item.isHash) {
      return location.pathname === '/' && location.hash === '#about'
    }
    if (item.path === '/') {
      return location.pathname === '/' && !location.hash
    }
    return location.pathname.startsWith(item.path)
  }

  const userInitial = (
    user?.user_metadata?.full_name?.charAt(0) ||
    user?.user_metadata?.name?.charAt(0) ||
    user?.email?.charAt(0) ||
    'U'
  ).toUpperCase()

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    'Customer'

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled
          ? 'bg-zinc-950/95 backdrop-blur-md shadow-lg shadow-black/30 border-b border-zinc-800/80'
          : 'bg-zinc-950 border-b border-zinc-900'
      }`}
    >
      <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* ================= LEFT SECTION: BRAND ================= */}
        <Link
          to="/"
          className="flex items-center gap-3 group focus:outline-none focus:ring-1 focus:ring-orange-500 rounded-lg p-1"
          aria-label="AirTouch Engineering Home"
        >
          {/* Automotive-themed custom icon badge */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-black border border-orange-500/30 flex items-center justify-center text-orange-500 group-hover:border-orange-500/70 group-hover:shadow-[0_0_12px_rgba(249,115,22,0.35)] transition-all duration-300">
            <Gauge className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
          </div>

          <div className="flex flex-col">
            <span className="font-extrabold tracking-wider text-base sm:text-lg leading-tight text-white uppercase flex items-center">
              AirTouch
              <span className="text-orange-500 ml-0.5 animate-pulse">.</span>
            </span>
            <span className="text-[9px] tracking-[0.26em] uppercase font-bold text-zinc-400 group-hover:text-zinc-300 transition-colors -mt-0.5">
              Engineering
            </span>
          </div>
        </Link>

        {/* ================= CENTRE SECTION: DESKTOP NAV LINKS ================= */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Main Navigation"
        >
          {navLinks.map((item) => {
            const active = isLinkActive(item)
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`relative py-2 text-sm uppercase tracking-wider font-semibold transition-colors duration-200 group focus:outline-none focus:text-white ${
                  active ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>{item.label}</span>

                {/* Active and hover indicator line */}
                {active ? (
                  <motion.span
                    layoutId="navbar-active-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                ) : (
                  <span className="absolute bottom-0 left-1/2 right-1/2 h-[2px] bg-orange-500/0 rounded-full transition-all duration-200 group-hover:left-0 group-hover:right-0 group-hover:bg-orange-500/70" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ================= RIGHT SECTION: ACTIONS ================= */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1. Compact Search Interface (Desktop & Tablet) */}
          <div ref={searchContainerRef} className="relative hidden sm:flex items-center">
            <AnimatePresence>
              {isSearchOpen && (
                <motion.form
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSearchSubmit}
                  className="overflow-hidden mr-2"
                >
                  <div className="relative flex items-center">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search parts, brakes..."
                      aria-label="Search spare parts"
                      className="w-full bg-zinc-900 border border-zinc-750 text-xs text-white placeholder-zinc-500 rounded-md py-1.5 pl-3 pr-7 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search input"
                        className="absolute right-2 text-zinc-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              aria-label={isSearchOpen ? 'Close search' : 'Open search'}
              title="Search Products"
              className={`p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer ${
                isSearchOpen ? 'text-orange-500 bg-zinc-900' : ''
              }`}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Cart with Dynamic Count Badge */}
          <Link
            to="/cart"
            data-testid="navbar-cart-link"
            aria-label={`Shopping Cart with ${itemCount} items`}
            title="Shopping Cart"
            className="p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500 relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span
                data-testid="navbar-cart-badge"
                className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 text-[10px] font-black leading-none bg-orange-500 text-black rounded-full flex items-center justify-center shadow-sm pointer-events-none"
                aria-hidden="true"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {/* 3. Dark / Light Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            className="p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-orange-400" />
            )}
          </button>

          {/* ================= 4. DESKTOP / TABLET AUTH BUTTONS OR AVATAR DROPDOWN ================= */}
          <div className="hidden md:flex items-center gap-2 pl-1 border-l border-zinc-850">
            {admin && (
              <Link
                to="/admin"
                data-testid="navbar-admin-link"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/40 text-orange-400 hover:bg-orange-500/20 text-xs font-bold uppercase tracking-wider transition-colors mr-1"
              >
                <span>Admin</span>
              </Link>
            )}
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  data-testid="navbar-avatar-button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  aria-label="Open user menu"
                  aria-expanded={isUserMenuOpen}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-black font-black text-sm flex items-center justify-center shadow-[0_0_12px_rgba(249,115,22,0.35)] hover:scale-105 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                >
                  {userInitial}
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      data-testid="navbar-user-dropdown"
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 text-white"
                    >
                      <div className="px-4 py-2 border-b border-zinc-850">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                          Signed in as
                        </p>
                        <p className="text-xs font-semibold text-zinc-200 truncate mt-0.5">
                          {userDisplayName}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/account"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                        >
                          <User className="w-4 h-4 text-orange-500" />
                          <span>My Account</span>
                        </Link>

                        <Link
                          to="/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                        >
                          <Package className="w-4 h-4 text-orange-500" />
                          <span>My Orders</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-zinc-850">
                        <button
                          type="button"
                          data-testid="navbar-logout-button"
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            signOut()
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-zinc-900 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  data-testid="navbar-login-link"
                  title={!isConfigured ? 'Supabase not configured in .env' : undefined}
                  className="hidden lg:inline-flex items-center px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  Log In
                </Link>
                <Link
                  to="/auth"
                  data-testid="navbar-signup-link"
                  title={!isConfigured ? 'Supabase not configured in .env' : undefined}
                  className="inline-flex items-center px-3.5 sm:px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_14px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.45)] focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* ================= MOBILE MENU BUTTON ================= */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            className="md:hidden p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* ================= MOBILE NAVIGATION DRAWER ================= */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 top-20 bg-black/70 backdrop-blur-sm z-30 md:hidden"
              aria-hidden="true"
            />

            {/* Slide-down Drawer Panel */}
            <motion.div
              id="mobile-navigation-drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="relative z-40 md:hidden bg-zinc-950 border-b border-zinc-800 shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-6 space-y-6">
                {/* 0. Admin session indicator in mobile drawer if active */}
                {admin && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-orange-500">
                        Admin Authorized
                      </p>
                      <p className="text-xs font-semibold text-zinc-300 truncate max-w-[180px]">
                        {admin.email}
                      </p>
                    </div>
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm"
                    >
                      Console
                    </Link>
                  </div>
                )}

                {/* 1. Mobile Auth Header: Log In & Sign Up buttons or Logged-in Profile */}
                {user ? (
                  <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-black font-black text-sm flex items-center justify-center shrink-0">
                        {userInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                          Logged In
                        </p>
                        <p className="text-xs font-semibold text-white truncate">
                          {userDisplayName}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        signOut()
                      }}
                      className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 px-2 py-1 rounded transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Link
                      to="/auth"
                      data-testid="mobile-login-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-zinc-850"
                    >
                      <User className="w-3.5 h-3.5 text-orange-500" />
                      <span>Log In</span>
                    </Link>
                    <Link
                      to="/auth"
                      data-testid="mobile-signup-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-2.5 rounded-lg bg-orange-500 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center shadow-md"
                    >
                      <span>Sign Up</span>
                    </Link>
                  </div>
                )}

                {/* 2. Mobile Search Input */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search motorcycle parts..."
                    aria-label="Search products"
                    className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 rounded-lg py-2.5 pl-4 pr-10 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="submit"
                    aria-label="Search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-orange-500"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </form>

                {/* 3. Primary Navigation Links */}
                <nav className="flex flex-col space-y-2" aria-label="Mobile Navigation Links">
                  {navLinks.map((item) => {
                    const active = isLinkActive(item)
                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors ${
                          active
                            ? 'bg-zinc-900 text-orange-500 border-l-2 border-orange-500'
                            : 'text-zinc-300 hover:text-white hover:bg-zinc-900/60'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ArrowRight className="w-4 h-4 opacity-50" />
                      </Link>
                    )
                  })}
                </nav>

                {/* 4. Quick Account, Orders, and Cart Links */}
                <div className="pt-4 border-t border-zinc-900 grid grid-cols-2 gap-3">
                  <Link
                    to="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 bg-zinc-900/50 hover:bg-zinc-900 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4 text-orange-500" />
                    <span>My Account</span>
                  </Link>

                  <Link
                    to="/cart"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 bg-zinc-900/50 hover:bg-zinc-900 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-orange-500" />
                      <span>Cart</span>
                    </div>
                    {itemCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-500 text-black rounded-full">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
