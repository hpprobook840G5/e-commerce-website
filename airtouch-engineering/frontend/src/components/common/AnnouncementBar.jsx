import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, ArrowRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Default placeholder promotional configuration.
 * Configurable object structure designed for future Express/Supabase integration.
 */
export const DEFAULT_OFFER = {
  isActive: true,
  label: 'SPECIAL OFFER',
  message: 'PERFORMANCE BRAKE PADS',
  productName: 'Carbon-Ceramic Series',
  discountPercentage: 30,
  productSlug: 'performance-brake-pads',
  expiryDate: null, // ISO string (e.g. '2026-12-31T23:59:59Z') or null for no expiry
  theme: 'auto', // 'auto' | 'dark' | 'light'
}

/**
 * Premium promotional announcement bar component.
 *
 * @param {Object} props
 * @param {Object} [props.offer] - Configurable promotion object
 * @param {Function} [props.onDismiss] - Optional callback triggered on dismissal
 */
export default function AnnouncementBar({ offer = DEFAULT_OFFER, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true)

  const config = { ...DEFAULT_OFFER, ...offer }

  // Check if offer is active
  if (!config.isActive) {
    return null
  }

  // Check if offer has expired
  if (config.expiryDate) {
    const expiryTime = new Date(config.expiryDate).getTime()
    if (!isNaN(expiryTime) && expiryTime <= Date.now()) {
      return null
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    if (typeof onDismiss === 'function') {
      onDismiss()
    }
  }

  // Theme style resolution
  const isForcedDark = config.theme === 'dark'
  const isForcedLight = config.theme === 'light'

  // Outer container styling
  const containerThemeClasses = isForcedDark
    ? 'bg-zinc-950 text-white border-orange-500/20'
    : isForcedLight
      ? 'bg-neutral-100 text-neutral-900 border-orange-500/20'
      : 'bg-neutral-100 text-neutral-900 border-orange-500/20 dark:bg-zinc-950 dark:text-white dark:border-orange-500/20'

  // Badge styling
  const badgeThemeClasses = isForcedDark
    ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
    : isForcedLight
      ? 'bg-orange-500/15 text-orange-600 border-orange-500/30'
      : 'bg-orange-500/15 text-orange-600 border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30'

  // Discount highlight styling
  const discountThemeClasses = isForcedDark
    ? 'text-orange-400'
    : isForcedLight
      ? 'text-orange-600'
      : 'text-orange-600 dark:text-orange-400'

  // CTA link styling
  const ctaThemeClasses = isForcedDark
    ? 'text-white hover:text-orange-400'
    : isForcedLight
      ? 'text-neutral-900 hover:text-orange-600'
      : 'text-neutral-900 hover:text-orange-600 dark:text-white dark:hover:text-orange-400'

  // Dismiss button styling
  const dismissThemeClasses = isForcedDark
    ? 'text-neutral-400 hover:text-white hover:bg-white/10'
    : isForcedLight
      ? 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60'
      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          role="region"
          aria-label="Promotional Announcement"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="relative w-full overflow-hidden z-50 border-b select-none shadow-sm"
        >
          <div
            className={`w-full min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 flex items-center justify-between text-xs sm:text-sm font-medium transition-colors ${containerThemeClasses}`}
          >
            {/* Subtle fiery accent bottom line */}
            <div
              className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            {/* Main promotional content */}
            <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 flex-wrap py-1.5 px-2 text-center overflow-hidden">
              {/* Promotional icon */}
              <Flame
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0"
                aria-hidden="true"
              />

              {/* Promotional label */}
              {config.label && (
                <span
                  className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border shrink-0 ${badgeThemeClasses}`}
                >
                  {config.label}
                </span>
              )}

              {/* Offer message & Product name */}
              <span className="truncate font-semibold tracking-tight">
                {config.message}
                {config.productName && (
                  <span className="hidden md:inline font-normal text-neutral-500 dark:text-neutral-400">
                    {' '}({config.productName})
                  </span>
                )}
              </span>

              {/* Divider */}
              <span className="hidden md:inline text-neutral-300 dark:text-neutral-700" aria-hidden="true">
                |
              </span>

              {/* Discount highlight */}
              {config.discountPercentage && (
                <span className={`font-extrabold uppercase whitespace-nowrap ${discountThemeClasses}`}>
                  UP TO {config.discountPercentage}% OFF
                </span>
              )}

              {/* Divider */}
              <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700" aria-hidden="true">
                |
              </span>

              {/* Call-to-action button */}
              <Link
                to={`/products/${config.productSlug}`}
                className={`inline-flex items-center gap-1 font-bold group transition-colors duration-150 uppercase tracking-wide whitespace-nowrap ${ctaThemeClasses}`}
              >
                <span>SHOP NOW</span>
                <ArrowRight
                  className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss promotional announcement"
              className={`p-1 rounded shrink-0 transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer ml-1 ${dismissThemeClasses}`}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

