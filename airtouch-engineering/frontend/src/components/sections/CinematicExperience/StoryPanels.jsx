import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CINEMATIC_CONFIG } from './cinematicConfig.js'

/**
 * StoryPanels Component
 * Holds storyboard text in the DOM for SEO, screen readers, and WCAG AA compliance.
 * Visually animated (opacity & transform only, force3D: true) via the GSAP master timeline.
 */
const StoryPanels = forwardRef(function StoryPanels({ tier }, ref) {
  const { storyboard } = CINEMATIC_CONFIG

  return (
    <div
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none z-30 flex flex-col justify-between p-6 sm:p-10 lg:p-16 select-none"
    >
      {/* ================= SCENE 1: THE ROAD AWAKENS (Top/Center) ================= */}
      <div
        data-story-panel="1"
        className="story-panel-1 cinematic-story-panel max-w-lg mx-auto text-center opacity-0 translate-y-6 transition-none"
      >
        <span className="inline-block px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold tracking-[0.25em] uppercase shadow-sm">
          {storyboard.roadIntro.eyebrow}
        </span>
      </div>

      {/* ================= SCENE 3: ENGINEERED FOR PERFORMANCE (Left Third on Desktop) ================= */}
      <div
        data-story-panel="2"
        className="story-panel-2 cinematic-story-panel absolute bottom-12 left-6 right-6 sm:bottom-auto sm:top-1/3 sm:left-10 lg:left-20 max-w-md sm:max-w-lg opacity-0 -translate-x-8 transition-none"
      >
        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 shadow-2xl relative overflow-hidden">
          {/* Orange Accent Bar */}
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500" />

          <span className="text-[11px] font-bold tracking-[0.25em] text-orange-400 uppercase">
            {storyboard.productShowcase.heading}
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold uppercase tracking-tight text-white leading-tight">
            {storyboard.productShowcase.headline}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
            {storyboard.productShowcase.description}
          </p>
        </div>
      </div>

      {/* ================= SCENE 4: WHO WE ARE (Left Third on Desktop, Right side has the bike) ================= */}
      <div
        data-story-panel="3"
        className="story-panel-3 cinematic-story-panel absolute bottom-12 left-6 right-6 sm:bottom-auto sm:top-1/3 sm:left-10 lg:left-20 max-w-md sm:max-w-lg opacity-0 translate-x-8 transition-none"
      >
        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 shadow-2xl relative overflow-hidden">
          {/* Engineering Accent Line */}
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-orange-500" />

          <span className="text-[11px] font-bold tracking-[0.25em] text-orange-400 uppercase">
            {storyboard.brandIntro.heading}
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold uppercase tracking-tight text-white leading-tight">
            {storyboard.brandIntro.headline}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
            {storyboard.brandIntro.description}
          </p>
        </div>
      </div>

      {/* ================= SCENE 5: PRODUCT TRANSITION (Centered with CTA) ================= */}
      <div
        data-story-panel="4"
        className="story-panel-4 cinematic-story-panel my-auto mx-auto max-w-xl text-center opacity-0 translate-y-8 transition-none pointer-events-auto"
      >
        <div className="p-8 sm:p-10 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800/80 shadow-2xl">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-wider text-white">
            {storyboard.productTransition.tagline}
          </h2>
          <div className="mt-6 flex justify-center">
            <Link
              to={storyboard.productTransition.ctaPath}
              className="px-8 py-3.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider inline-flex items-center gap-2 transition-all duration-200 shadow-[0_0_24px_rgba(249,115,22,0.4)] group cursor-pointer"
            >
              <span>{storyboard.productTransition.ctaText}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
})

export default StoryPanels
