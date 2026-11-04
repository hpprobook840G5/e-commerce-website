// TODO: replace with real AirTouch Engineering contact details.

import { useState, useEffect } from 'react'
import { ArrowRight, MessageCircle, Phone } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Placeholder contact details for AirTouch Engineering.
 * TODO: Swap email, phone, head office address, and branch details with real production values.
 */
export const CONTACT_CONFIG = {
  eyebrowLeft: 'SAY HELLO',
  // TODO: Replace with real AirTouch Engineering support/sales email
  email: {
    user: 'hello',
    domain: 'airtouchengineering.in',
    full: 'hello@airtouchengineering.in',
  },
  description:
    'Have a question about parts, compatibility, or bulk orders? Our team replies within one working day.',
  // TODO: Replace with real AirTouch Engineering phone number
  phone: {
    display: '+91 90000 00000',
    dial: '+919000000000',
  },
  eyebrowRight: 'HEAD OFFICE',
  // TODO: Ask for the real AirTouch Engineering workshop/head office address and replace below
  address: {
    line1: 'Unit 14, Industrial Estate, NH-66 Bypass',
    line2: 'Calicut, Kerala 673014, India',
  },
  workingHoursLabel: 'Mon–Sat · 9:30 am to 6:30 pm IST',
  branches: [
    {
      id: 'calicut-hq',
      city: 'Calicut',
      timeZone: 'Asia/Kolkata',
      // Working days: Monday (1) through Saturday (6); Sunday (0) closed
      workDays: [1, 2, 3, 4, 5, 6],
      openMinutes: 9 * 60 + 30,  // 9:30 am
      closeMinutes: 18 * 60 + 30, // 6:30 pm
      openLabel: '9:30 am',
    },
    /*
     * TODO: To add a second city/branch block later, uncomment and configure below:
     * {
     *   id: 'cochin-branch',
     *   city: 'Kochi',
     *   timeZone: 'Asia/Kolkata',
     *   workDays: [1, 2, 3, 4, 5, 6],
     *   openMinutes: 9 * 60 + 30,
     *   closeMinutes: 18 * 60 + 30,
     *   openLabel: '9:30 am',
     * },
     */
  ],
}

const WEEKDAY_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

/**
 * Computes live local time string (e.g. "7:51 pm") and open/closed status
 * from the branch's timezone and working-hours schedule using the Intl API.
 */
export function getBranchLiveStatus(branch, now = new Date()) {
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: branch.timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const formattedTime = timeFormatter.format(now).toLowerCase()

  const partsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: branch.timeZone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const parts = partsFormatter.formatToParts(now)
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value || 'Mon'
  const rawHour = Number(parts.find((p) => p.type === 'hour')?.value || 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0)

  const dayIndex = WEEKDAY_INDEX[weekdayStr] ?? 1
  const hour24 = rawHour === 24 ? 0 : rawHour
  const currentMinutes = hour24 * 60 + minute

  const isWorkDay = branch.workDays.includes(dayIndex)
  const isOpen =
    isWorkDay &&
    currentMinutes >= branch.openMinutes &&
    currentMinutes < branch.closeMinutes

  if (isOpen) {
    return {
      timeString: formattedTime,
      isOpen: true,
      statusText: 'Open now',
    }
  }

  // Determine next opening label when outside working hours
  let nextOpenText = `opens ${branch.openLabel}`
  if (dayIndex === 6 && currentMinutes >= branch.closeMinutes) {
    // Saturday after closing -> opens Monday
    nextOpenText = `opens Mon ${branch.openLabel}`
  } else if (dayIndex === 0) {
    // Sunday -> opens Monday
    nextOpenText = `opens Mon ${branch.openLabel}`
  }

  return {
    timeString: formattedTime,
    isOpen: false,
    statusText: `Closed · ${nextOpenText}`,
  }
}

/**
 * Builds the Google Maps directions URL:
 * Reuses VITE_GOOGLE_MAPS_EMBED_URL (same env var source as MapEmbed.jsx) if configured,
 * otherwise constructs a valid maps.google.com/?q= search URL from the Head Office address.
 */
function getDirectionsUrl(address) {
  // TODO: Replace fallback search link with the real Google Maps place URL or set VITE_GOOGLE_MAPS_EMBED_URL
  const envMapUrl = (import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL || '').trim()
  if (envMapUrl && !envMapUrl.includes('/maps/embed')) {
    return envMapUrl
  }
  const fullQuery = `AirTouch Engineering, ${address.line1}, ${address.line2}`
  return `https://maps.google.com/?q=${encodeURIComponent(fullQuery)}`
}

export default function ContactSection() {
  const shouldReduceMotion = useReducedMotion()
  const [now, setNow] = useState(() => new Date())

  // Update live clock every minute (aligned to minute boundary, plus 30s safety tick)
  useEffect(() => {
    setNow(new Date())
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 30_000)
    return () => clearInterval(intervalId)
  }, [])

  // Reuse the exact same WhatsApp env var source as components/common/WhatsAppButton.jsx
  const rawWhatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').trim()
  const sanitizedWhatsapp = rawWhatsappNumber.replace(/[^0-9]/g, '')
  const whatsappHref = `https://wa.me/${sanitizedWhatsapp}`

  const directionsHref = getDirectionsUrl(CONTACT_CONFIG.address)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  }

  const columnVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.55,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  return (
    <section
      id="contact"
      aria-label="Contact AirTouch Engineering"
      className="relative w-full bg-zinc-950 text-white py-12 lg:py-20 border-t border-zinc-900 overflow-x-clip box-border"
    >
      {/* Preserve #about anchor compatibility for BrandIntroduction secondary CTA */}
      <div id="about" className="sr-only" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full box-border">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start"
        >
          {/* ================= LEFT COLUMN: SAY HELLO, EMAIL & CHIPS ================= */}
          <motion.div
            variants={columnVariants}
            className="lg:col-span-7 flex flex-col items-start min-w-0 w-full"
          >
            {/* Eyebrow */}
            <span className="text-xs font-bold tracking-[0.25em] text-orange-500 uppercase">
              {CONTACT_CONFIG.eyebrowLeft}
            </span>

            {/* Large Email Display Heading (wraps cleanly on 320px-430px with zero horizontal overflow) */}
            <h2
              className="mt-3 font-extrabold tracking-tight text-white leading-[1.12] max-w-full break-words [overflow-wrap:anywhere]"
              style={{
                fontSize: 'clamp(1.35rem, calc(0.85rem + 2.45vw), 2.85rem)',
              }}
            >
              <a
                href={`mailto:${CONTACT_CONFIG.email.full}`}
                data-testid="contact-email-link"
                className="hover:text-orange-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded"
              >
                {CONTACT_CONFIG.email.user}@
                <wbr />
                {CONTACT_CONFIG.email.domain}
              </a>
            </h2>

            {/* Description Copy */}
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl">
              {CONTACT_CONFIG.description}
            </p>

            {/* Two Contact Chips Side by Side */}
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4 max-w-full">
              {/* WhatsApp Chip (Green icon per WhatsApp brand recognition) */}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="contact-whatsapp-chip"
                className="inline-flex items-center gap-3 pl-2 pr-5 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 text-white transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <span className="w-9 h-9 rounded-full bg-[#25D366] text-zinc-950 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(37,211,102,0.3)] group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-4 h-4 fill-current" />
                </span>
                <span className="text-sm font-bold tracking-wide text-white">
                  WhatsApp
                </span>
              </a>

              {/* Phone Chip (AirTouch Orange Accent) */}
              <a
                href={`tel:${CONTACT_CONFIG.phone.dial}`}
                data-testid="contact-phone-chip"
                className="inline-flex items-center gap-3 pl-2 pr-5 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-orange-500/50 text-white transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <span className="w-9 h-9 rounded-full bg-orange-500 text-zinc-950 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(249,115,22,0.35)] group-hover:scale-105 transition-transform">
                  <Phone className="w-4 h-4 fill-current" />
                </span>
                <span className="text-sm font-bold tracking-wide text-white whitespace-nowrap">
                  {CONTACT_CONFIG.phone.display}
                </span>
              </a>
            </div>
          </motion.div>

          {/* ================= RIGHT COLUMN: HEAD OFFICE, DIRECTIONS & LIVE TIME ================= */}
          <motion.div
            variants={columnVariants}
            className="lg:col-span-5 flex flex-col items-start min-w-0 w-full"
          >
            {/* Eyebrow */}
            <span className="text-xs font-bold tracking-[0.25em] text-orange-500 uppercase">
              {CONTACT_CONFIG.eyebrowRight}
            </span>

            {/* Two-Line Bold White Address */}
            <address className="not-italic mt-3 text-lg sm:text-xl font-extrabold text-white leading-snug tracking-tight">
              <span className="block">{CONTACT_CONFIG.address.line1}</span>
              <span className="block">{CONTACT_CONFIG.address.line2}</span>
            </address>

            {/* Working Hours Line */}
            <p className="mt-2.5 text-sm font-medium text-zinc-400">
              {CONTACT_CONFIG.workingHoursLabel}
            </p>

            {/* Get Directions Link */}
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="contact-directions-link"
              className="mt-4 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-500 hover:text-white uppercase tracking-wider transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded"
            >
              <span>Get directions</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>

            {/* Horizontal Divider */}
            <hr className="w-full my-8 border-t border-zinc-800/90" />

            {/* Live Local Time Block(s) */}
            <div
              className={`w-full grid gap-6 ${
                CONTACT_CONFIG.branches.length > 1
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1'
              }`}
            >
              {CONTACT_CONFIG.branches.map((branch) => {
                const live = getBranchLiveStatus(branch, now)
                return (
                  <div
                    key={branch.id}
                    data-testid={`branch-time-block-${branch.id}`}
                    className="flex flex-col items-start"
                  >
                    <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                      {branch.city}
                    </span>
                    <div
                      data-testid="branch-live-time"
                      className="mt-1 text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
                    >
                      {live.timeString}
                    </div>
                    <div
                      data-testid="branch-open-status"
                      className={`mt-1.5 inline-flex items-center gap-2 text-xs font-semibold tracking-wide ${
                        live.isOpen ? 'text-emerald-400' : 'text-orange-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          live.isOpen
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-orange-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span>{live.statusText}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

