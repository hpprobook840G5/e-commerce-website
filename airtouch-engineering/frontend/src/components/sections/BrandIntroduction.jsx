import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, Wrench, ShieldCheck, Gauge } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Structured content configuration for the Brand Introduction section.
 * Easily modifiable for future CMS, backend, or localization updates.
 */
export const BRAND_INTRO_CONTENT = {
  eyebrow: 'ENGINEERED FOR THE RIDE',
  heading: {
    primary: 'AIRTOUCH',
    accent: 'ENGINEERING',
  },
  supportingHeadline: 'Precision. Performance. Reliability.',
  description:
    'Your trusted destination for motorcycle spare parts and performance components. We bring together quality, engineering, and passion for every ride.',
  primaryCta: {
    label: 'EXPLORE PRODUCTS',
    path: '/products',
  },
  secondaryCta: {
    label: 'DISCOVER OUR STORY',
    targetSectionId: 'about',
  },
  technicalBadges: [
    {
      icon: Gauge,
      label: 'TOLERANCE',
      value: 'CNC AEROSPACE GRADE',
    },
    {
      icon: ShieldCheck,
      label: 'STANDARD',
      value: 'OEM SPECIFICATION',
    },
    {
      icon: Wrench,
      label: 'TESTING',
      value: 'DYNO & TRACK VERIFIED',
    },
  ],
  cadMetadata: {
    ref: 'DOC-ENG // REV 4.2',
    datum: 'ZERO-TOLERANCE SPEC',
  },
}

/**
 * Premium Automotive Brand Introduction Section.
 * Fully responsive across all devices (320px mobile to 1920px+ ultra-wide).
 */
export default function BrandIntroduction({ content = BRAND_INTRO_CONTENT }) {
  const shouldReduceMotion = useReducedMotion()

  // Handle smooth scroll to existing About section
  const handleScrollToAbout = (e) => {
    e.preventDefault()
    const targetElement = document.getElementById(content.secondaryCta.targetSectionId)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' })
    } else {
      // If no #about element is on the current page, route to /#about
      window.location.hash = content.secondaryCta.targetSectionId
    }
  }

  // Motion variants with staggered sequence
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
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
      aria-label="AirTouch Engineering Brand Introduction"
      className="relative w-full bg-zinc-950 text-white dark:bg-zinc-950 dark:text-white overflow-hidden py-12 sm:py-16 md:py-20 lg:py-24 select-none box-border"
    >
      {/* ================= BACKGROUND EFFECTS ================= */}
      {/* 1. Subtle warm radial lighting behind heading */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] md:w-[750px] h-[220px] sm:h-[350px] bg-gradient-to-b from-orange-600/15 via-orange-500/5 to-transparent rounded-full blur-[80px] sm:blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      {/* 2. Faint technical engineering blueprint grid with radial mask */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,#000_65%,transparent_100%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* 3. Subtle CAD corner alignment markers */}
      <div
        className="absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-zinc-800 pointer-events-none hidden sm:block opacity-60"
        aria-hidden="true"
      />
      <div
        className="absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-zinc-800 pointer-events-none hidden sm:block opacity-60"
        aria-hidden="true"
      />

      {/* 4. Technical metadata callouts along the edges */}
      <div
        className="absolute top-8 left-12 text-[10px] tracking-[0.25em] font-mono text-zinc-600 uppercase hidden lg:block pointer-events-none select-none"
        aria-hidden="true"
      >
        {content.cadMetadata.ref}
      </div>
      <div
        className="absolute top-8 right-12 text-[10px] tracking-[0.25em] font-mono text-zinc-600 uppercase hidden lg:block pointer-events-none select-none"
        aria-hidden="true"
      >
        {content.cadMetadata.datum}
      </div>

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 w-full box-border">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center w-full"
        >
          {/* Eyebrow badge */}
          <motion.div variants={itemVariants} className="mb-4 sm:mb-6 max-w-full">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-[10px] sm:text-xs font-bold tracking-[0.16em] sm:tracking-[0.25em] uppercase shadow-sm max-w-full">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
              <span className="truncate">{content.eyebrow}</span>
            </span>
          </motion.div>

          {/* Main Brand Heading with Fluid Clamp Typography */}
          <motion.h1
            variants={itemVariants}
            className="w-full max-w-full font-black tracking-tight uppercase leading-[1.02] sm:leading-[1.05] xl:leading-[1.08] text-white flex flex-col md:flex-row md:flex-wrap xl:flex-nowrap items-center justify-center gap-x-3 sm:gap-x-4 lg:gap-x-5 gap-y-0.5 sm:gap-y-1.5 box-border select-none"
            style={{
              fontSize: 'clamp(2rem, calc(1.2rem + 3.8vw), 5.25rem)',
              wordBreak: 'normal',
              overflowWrap: 'normal',
            }}
          >
            <span className="block whitespace-nowrap text-white">
              {content.heading.primary}
            </span>
            <span className="block whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 drop-shadow-[0_0_35px_rgba(249,115,22,0.3)]">
              {content.heading.accent}
            </span>
          </motion.h1>

          {/* Supporting Headline */}
          <motion.div
            variants={itemVariants}
            className="mt-4 sm:mt-6 md:mt-8 flex items-center justify-center gap-1.5 sm:gap-3 text-xs sm:text-base md:text-lg lg:text-xl font-bold uppercase tracking-[0.14em] sm:tracking-[0.2em] text-zinc-300 text-center flex-wrap px-2"
          >
            <span>{content.supportingHeadline}</span>
          </motion.div>

          {/* Description text */}
          <motion.p
            variants={itemVariants}
            className="mt-3 sm:mt-5 max-w-2xl text-xs sm:text-sm md:text-base lg:text-lg text-zinc-400 leading-relaxed font-normal px-2"
          >
            {content.description}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="mt-6 sm:mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0"
          >
            {/* Primary CTA */}
            <Link
              to={content.primaryCta.path}
              className="w-full sm:w-auto min-h-[48px] px-6 sm:px-8 py-3.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 shadow-[0_0_24px_rgba(249,115,22,0.35)] hover:shadow-[0_0_32px_rgba(249,115,22,0.55)] group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-950 cursor-pointer"
            >
              <span>{content.primaryCta.label}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            {/* Secondary CTA */}
            <button
              type="button"
              onClick={handleScrollToAbout}
              className="w-full sm:w-auto min-h-[48px] px-6 sm:px-7 py-3.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-950 cursor-pointer group"
            >
              <span>{content.secondaryCta.label}</span>
              <ChevronDown className="w-4 h-4 text-orange-500 transition-transform duration-200 group-hover:translate-y-0.5" />
            </button>
          </motion.div>

          {/* Technical Specs Bar */}
          <motion.div
            variants={itemVariants}
            className="mt-10 sm:mt-14 md:mt-16 pt-6 sm:pt-8 border-t border-zinc-900/90 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center px-2 sm:px-0"
          >
            {content.technicalBadges.map((badge, idx) => {
              const Icon = badge.icon
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-lg bg-zinc-900/40 border border-zinc-850"
                >
                  <div className="flex items-center gap-1.5 text-orange-500 text-[11px] font-bold tracking-[0.2em] uppercase mb-1">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{badge.label}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-200 uppercase">
                    {badge.value}
                  </span>
                </div>
              )
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* ================= SMOOTH VISUAL TRANSITION ================= */}
      {/* Subtle bottom gradient connecting naturally into the cinematic 3D section */}
      <div
        className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-zinc-950 pointer-events-none"
        aria-hidden="true"
      />
    </section>
  )
}
