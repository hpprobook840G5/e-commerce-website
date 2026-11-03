import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { CINEMATIC_CONFIG, getActiveTier } from './cinematicConfig.js'
import StoryPanels from './StoryPanels.jsx'
import { createCinematicTimeline } from './cinematicTimeline.js'
import './cinematic.css'

// Lazy-load Three.js R3F Canvas chunk
const CinematicCanvas = lazy(() => import('./CinematicCanvas.jsx'))

gsap.registerPlugin(ScrollTrigger)

export default function CinematicExperience() {
  const containerRef = useRef(null)
  const glowOverlayRef = useRef(null)
  const exitOverlayRef = useRef(null)
  const panelsRef = useRef(null)

  // Direct DOM refs for ?debug=cinematic HUD (zero React re-renders on scroll or FPS tick)
  const debugSceneRef = useRef(null)
  const debugProgressRef = useRef(null)
  const debugBikeZRef = useRef(null)
  const debugRotRef = useRef(null)
  const debugIntensityRef = useRef(null)
  const debugFpsRef = useRef(null)

  // Mutable 3D state ref read directly by R3F useFrame (zero React re-renders on scroll)
  const cinematicStateRef = useRef({
    progress: 0,
    scene: 'roadIntro',
    bikeX: 0,
    bikeY: 0,
    bikeZ: -14,
    bikeRotX: 0,
    bikeRotY: 0,
    bikeRotZ: 0,
    camX: 0,
    camY: 0.65,
    camZ: 3.8,
    lookX: 0,
    lookY: 0.75,
    lookZ: -7.5,
    headlightIntensity: 2.2,
    rimIntensity: 2.4,
    intensity: 0.35,
  })

  // Mouse coords for subtle desktop parallax
  const mouseRef = useRef({ x: 0, y: 0 })

  // Active Tier, Viewport, and Pre-compile Loading Gate state
  const [tier, setTier] = useState(() => getActiveTier())
  const [isInViewport, setIsInViewport] = useState(true)
  const [isSceneReady, setIsSceneReady] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Debug query param state (?debug=cinematic)
  const [isDebugEnabled, setIsDebugEnabled] = useState(false)

  // Detect Reduced Motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Detect Debug query param (?debug=cinematic)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDebugEnabled(window.location.search.includes('debug=cinematic'))
    }
  }, [])

  // Safety timeout for loading gate so it never blocks if WebGL compile is delayed
  useEffect(() => {
    const gateTimer = setTimeout(() => {
      setIsSceneReady(true)
    }, 1200)
    return () => clearTimeout(gateTimer)
  }, [])

  const handleSceneReady = useCallback(() => {
    setIsSceneReady(true)
  }, [])

  // Track Tier changes with resize (only updates state if tier name actually changes)
  useEffect(() => {
    const handleResize = () => {
      const next = getActiveTier()
      setTier((prev) => (prev.name === next.name ? prev : next))
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mouse move listener for parallax (Desktop only)
  useEffect(() => {
    if (tier.name !== 'desktop') return

    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [tier.name])

  // IntersectionObserver to pause rendering when section is scrolled off screen
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        setIsInViewport(entries[0].isIntersecting)
      },
      { threshold: 0.01 }
    )

    visibilityObserver.observe(el)
    return () => visibilityObserver.disconnect()
  }, [])

  // GSAP ScrollTrigger Master Timeline Setup
  useEffect(() => {
    if (prefersReducedMotion) return

    let scrollTriggerInstance = null

    const ctx = gsap.context(() => {
      scrollTriggerInstance = createCinematicTimeline({
        container: containerRef.current,
        tier,
        cinematicStateRef,
        glowOverlayRef: glowOverlayRef.current,
        panelsContainerRef: panelsRef.current,
        exitOverlayRef: exitOverlayRef.current,
        onProgressUpdate: isDebugEnabled
          ? (progress, scene, bikeZ, rotY, intensity) => {
              if (debugSceneRef.current) debugSceneRef.current.textContent = scene
              if (debugProgressRef.current)
                debugProgressRef.current.textContent = (progress * 100).toFixed(1) + '%'
              if (debugBikeZRef.current)
                debugBikeZRef.current.textContent = bikeZ.toFixed(1)
              if (debugRotRef.current)
                debugRotRef.current.textContent =
                  Math.round((rotY * 180) / Math.PI) + '°'
              if (debugIntensityRef.current)
                debugIntensityRef.current.textContent = intensity.toFixed(2)
            }
          : null,
      })
    }, containerRef)

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 150)

    return () => {
      clearTimeout(refreshTimer)
      if (scrollTriggerInstance) {
        scrollTriggerInstance.kill()
      }
      ctx.revert()
    }
  }, [tier, prefersReducedMotion, isDebugEnabled])

  // Zero-re-render FPS tracker for debug overlay (?debug=cinematic)
  useEffect(() => {
    if (!isDebugEnabled) return

    let lastTime = performance.now()
    const frameTimes = new Float32Array(30)
    let index = 0
    let count = 0
    let animId = null

    const calcFps = (now) => {
      const delta = now - lastTime
      lastTime = now
      const currentFps = 1000 / Math.max(delta, 1)
      frameTimes[index] = currentFps
      index = (index + 1) % 30
      if (count < 30) count++

      let sum = 0
      for (let i = 0; i < count; i++) sum += frameTimes[i]
      const avgFps = Math.round(sum / count)

      if (debugFpsRef.current) {
        debugFpsRef.current.textContent = String(avgFps)
      }
      animId = requestAnimationFrame(calcFps)
    }

    animId = requestAnimationFrame(calcFps)
    return () => cancelAnimationFrame(animId)
  }, [isDebugEnabled])

  // ================= REDUCED MOTION STATIC FALLBACK =================
  if (prefersReducedMotion) {
    return (
      <section
        aria-label="AirTouch Engineering Overview"
        className="relative w-full bg-zinc-950 text-white py-20 px-6 sm:px-12 border-t border-zinc-900"
      >
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold tracking-[0.25em] uppercase mb-4">
              {CINEMATIC_CONFIG.storyboard.roadIntro.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              {CINEMATIC_CONFIG.storyboard.productShowcase.heading}
            </h2>
            <p className="mt-2 text-xl font-bold text-orange-400">
              {CINEMATIC_CONFIG.storyboard.productShowcase.headline}
            </p>
            <p className="mt-4 text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto">
              {CINEMATIC_CONFIG.storyboard.productShowcase.description}
            </p>
          </div>

          <div className="text-center pt-8 border-t border-zinc-900">
            <h3 className="text-2xl sm:text-4xl font-black uppercase text-white">
              {CINEMATIC_CONFIG.storyboard.brandIntro.heading}
            </h3>
            <p className="mt-2 text-lg font-bold text-orange-400">
              {CINEMATIC_CONFIG.storyboard.brandIntro.headline}
            </p>
            <p className="mt-4 text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto">
              {CINEMATIC_CONFIG.storyboard.brandIntro.description}
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to={CINEMATIC_CONFIG.storyboard.productTransition.ctaPath}
                className="px-8 py-3.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-black font-extrabold uppercase tracking-wider inline-flex items-center gap-2"
              >
                <span>{CINEMATIC_CONFIG.storyboard.productTransition.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={containerRef}
      aria-label="AirTouch Engineering Cinematic Scroll Experience"
      className="cinematic-pinned-container"
    >
      {/* Layer 1: Dark atmospheric base */}
      <div className="absolute inset-0 w-full h-full bg-zinc-950 pointer-events-none z-0">
        <img
          src={CINEMATIC_CONFIG.posterPath}
          alt=""
          className="w-full h-full object-cover opacity-20"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>

      {/* Layer 2: Real-time 3D React Three Fiber Scene (3D Motorcycle, Wet Asphalt Road, HDR Lighting & Post-Processing) */}
      <Suspense fallback={null}>
        <CinematicCanvas
          tier={tier}
          cinematicStateRef={cinematicStateRef}
          mouseRef={mouseRef}
          isInViewport={isInViewport}
          onSceneReady={handleSceneReady}
        />
      </Suspense>

      {/* Short Pre-Compile Loading Curtain (fades out once model + HDR + shaders are compiled) */}
      <div
        className={`absolute inset-0 bg-zinc-950 pointer-events-none z-12 transition-opacity duration-500 ${
          isSceneReady ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      />

      {/* Layer 3: Color Grade + Vignette Overlay */}
      <div className="cinematic-vignette-overlay" aria-hidden="true" />

      {/* Layer 4: Dynamic Orange Radial Glow Overlay (Opacity Tweened by GSAP) */}
      <div
        ref={glowOverlayRef}
        className="cinematic-glow-overlay"
        aria-hidden="true"
      />

      {/* Layer 5: Seamless Exit Fade Overlay to Page Background (#09090b) */}
      <div
        ref={exitOverlayRef}
        className="absolute inset-0 bg-zinc-950 pointer-events-none opacity-0 z-20"
        aria-hidden="true"
      />

      {/* Layer 6: Storyboard Text Panels (Top-level z-30 for interactive CTA) */}
      <StoryPanels ref={panelsRef} tier={tier} />

      {/* Dev-Only Telemetry HUD (Only displayed when URL has ?debug=cinematic) */}
      {isDebugEnabled && (
        <aside className="cinematic-debug-hud" aria-label="Cinematic Telemetry">
          <div className="font-bold border-b border-orange-500/50 pb-1 mb-1 text-orange-400">
            AIRTOUCH 3D TELEMETRY
          </div>
          <div>
            SCENE: <span ref={debugSceneRef}>roadIntro</span>
          </div>
          <div>
            PROGRESS: <span ref={debugProgressRef}>0.0%</span>
          </div>
          <div>
            BIKE Z: <span ref={debugBikeZRef}>-14.0</span>
          </div>
          <div>
            ROTATION: <span ref={debugRotRef}>0°</span>
          </div>
          <div>TIER: {tier.name.toUpperCase()}</div>
          <div>
            INTENSITY: <span ref={debugIntensityRef}>0.35</span>
          </div>
          <div>
            FPS: <span ref={debugFpsRef}>60</span>
          </div>
        </aside>
      )}
    </section>
  )
}
