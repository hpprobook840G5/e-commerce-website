import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Gauge } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { FOOTER_DATA } from './footerData.js'

function InstagramIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function FacebookIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function YoutubeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  )
}

const SOCIAL_ICON_MAP = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
}

const SHARED_LINK_CLASS =
  'inline-block text-sm text-zinc-400 hover:text-white focus:text-white underline-offset-4 hover:underline hover:decoration-orange-500 focus:underline focus:decoration-orange-500 transition-colors duration-150 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950'

export default function Footer() {
  const shouldReduceMotion = useReducedMotion()
  const currentYear = new Date().getFullYear()

  const { brand, columns, legalLinks, copyrightNotice } = FOOTER_DATA
  const socialLinks = FOOTER_DATA.getSocialLinks()
  const businessDetails = FOOTER_DATA.getBusinessDetails()

  const motionProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.1 },
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      }

  return (
    <footer className="w-full bg-zinc-950 text-white border-t border-zinc-900 pt-12 pb-24 sm:pb-20 lg:py-16 overflow-x-clip box-border">
      <motion.div
        {...motionProps}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full box-border"
      >
        {/* Main Footer Navigation & Brand Grid */}
        <nav
          aria-label="Footer"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-12 items-start"
        >
          {/* ================= BRAND COLUMN (2fr on Desktop, Full Width on Tablet/Mobile) ================= */}
          <div className="md:col-span-2 lg:col-span-1 flex flex-col items-start min-w-0 max-w-md">
            {/* Reused Navbar Wordmark & Gauge Badge */}
            <Link
              to="/"
              aria-label="AirTouch Engineering Home"
              className="flex items-center gap-3 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-black border border-orange-500/30 flex items-center justify-center text-orange-500 group-hover:border-orange-500/70 group-hover:shadow-[0_0_12px_rgba(249,115,22,0.35)] transition-all duration-300 shrink-0">
                <Gauge className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-wider text-base sm:text-lg leading-tight text-white uppercase flex items-center">
                  {brand.namePrimary}
                  <span className="text-orange-500 ml-0.5">{brand.nameAccent}</span>
                </span>
                <span className="text-[9px] tracking-[0.26em] uppercase font-bold text-zinc-400 group-hover:text-zinc-300 transition-colors -mt-0.5">
                  {brand.nameSecondary}
                </span>
              </div>
            </Link>

            {/* One-line Tagline */}
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
              {brand.tagline}
            </p>

            {/* Short Description (2 lines max) */}
            <p className="mt-2.5 text-sm text-zinc-400 leading-relaxed line-clamp-2">
              {brand.description}
            </p>

            {/* Social Icons Row (Only rendered when at least one social env var is configured) */}
            {socialLinks.length > 0 && (
              <div
                data-testid="footer-social-links"
                className="mt-6 flex items-center gap-3 flex-wrap"
              >
                {socialLinks.map((social) => {
                  const Icon = SOCIAL_ICON_MAP[social.id] || InstagramIcon
                  return (
                    <a
                      key={social.id}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.ariaLabel}
                      className="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-orange-500/60 text-zinc-300 hover:text-orange-400 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  )
                })}
              </div>
            )}

            {/* Business Compliance Details (Only rendered for non-empty env vars) */}
            {businessDetails.length > 0 && (
              <dl
                data-testid="footer-business-details"
                className="mt-6 pt-5 border-t border-zinc-900 w-full space-y-1.5 text-xs text-zinc-400"
              >
                {businessDetails.map((item) => (
                  <div key={item.id} className="flex flex-wrap gap-x-1.5">
                    <dt className="font-semibold text-zinc-300">{item.label}:</dt>
                    <dd className="break-words [overflow-wrap:anywhere]">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* ================= LINK COLUMNS: SHOP, HELP, COMPANY ================= */}
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col items-start min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-orange-500 mb-4">
                {col.heading}
              </h2>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className={SHARED_LINK_CLASS}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* ================= BOTTOM BAR: COPYRIGHT, MADE IN KERALA & LEGAL LINKS ================= */}
        <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-zinc-400">
            <p data-testid="footer-copyright">{copyrightNotice(currentYear)}</p>
            {Boolean(brand.madeInLine) && (
              <>
                <span
                  className="hidden sm:inline-block text-zinc-700"
                  aria-hidden="true"
                >
                  ·
                </span>
                <p
                  data-testid="footer-made-in"
                  className="text-zinc-500 font-medium"
                >
                  {brand.madeInLine}
                </p>
              </>
            )}
          </div>

          {/* Legal Links Separated by Thin Dividers */}
          <div
            aria-label="Legal Links"
            className="flex flex-wrap items-center justify-center gap-y-2"
          >
            {legalLinks.map((link, idx) => (
              <Fragment key={link.label}>
                {idx > 0 && (
                  <span
                    className="mx-3 h-3.5 w-px bg-zinc-800 inline-block"
                    aria-hidden="true"
                  />
                )}
                <Link to={link.to} className={SHARED_LINK_CLASS}>
                  {link.label}
                </Link>
              </Fragment>
            ))}
          </div>
        </div>
      </motion.div>
    </footer>
  )
}
