import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, Rotate3d } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import {
  CINEMATIC_CONFIG,
  CLICKABLE_PARTS,
  APPROACH_START_BIKE_POS,
  APPROACH_START_BIKE_ROTATION,
  APPROACH_START_CAMERA_POS,
  APPROACH_START_LOOK_AT,
  SHOWCASE_BIKE_POS,
  SHOWCASE_BIKE_ROTATION,
  SHOWCASE_CAMERA_POS,
  SHOWCASE_CAMERA_LOOK_AT,
  getActiveTier,
} from './cinematicConfig.js'
import { createCinematicTimeline } from './cinematicTimeline.js'
import './cinematic.css'

// Lazy-load Three.js R3F Canvas chunk
const CinematicCanvas = lazy(() => import('./CinematicCanvas.jsx'))

gsap.registerPlugin(ScrollTrigger)
if (typeof window !== 'undefined') {
  window.ScrollTrigger = ScrollTrigger
  window.__ScrollTrigger = ScrollTrigger
}

export default function CinematicExperience() {
  const navigate = useNavigate()

  const wrapperRef = useRef(null)
  const containerRef = useRef(null)
  const interactiveStageRef = useRef(null)
  const glowOverlayRef = useRef(null)
  const floatingLabelRef = useRef(null)
  const mobileDotRefs = useRef({})
  const interactionRef = useRef(null)
  const scrollTriggerRef = useRef(null)
  const hasDismissedHintRef = useRef(false)

  // Direct DOM refs for ?debug=cinematic HUD (zero React re-renders on scroll or FPS tick)
  const debugSceneRef = useRef(null)
  const debugProgressRef = useRef(null)
  const debugBikeZRef = useRef(null)
  const debugRotRef = useRef(null)
  const debugIntensityRef = useRef(null)
  const debugFpsRef = useRef(null)

  // Mutable 3D state ref read directly by R3F useFrame (zero React re-renders per frame / pointer move)
  const cinematicStateRef = useRef({
    progress: 0,
    phase: 'approach',
    scene: 'approach',
    bikeX: APPROACH_START_BIKE_POS[0],
    bikeY: APPROACH_START_BIKE_POS[1],
    bikeZ: APPROACH_START_BIKE_POS[2],
    bikeRotX: APPROACH_START_BIKE_ROTATION[0],
    bikeRotY: APPROACH_START_BIKE_ROTATION[1],
    bikeRotZ: APPROACH_START_BIKE_ROTATION[2],
    currentRotY: APPROACH_START_BIKE_ROTATION[1],
    targetRotY: APPROACH_START_BIKE_ROTATION[1],
    camX: APPROACH_START_CAMERA_POS[0],
    camY: APPROACH_START_CAMERA_POS[1],
    camZ: APPROACH_START_CAMERA_POS[2],
    lookX: APPROACH_START_LOOK_AT[0],
    lookY: APPROACH_START_LOOK_AT[1],
    lookZ: APPROACH_START_LOOK_AT[2],
    headlightIntensity: 2.2,
    rimIntensity: 2.4,
    intensity: 0.35,
    isDragging: false,
    isPointerHovering: false,
    lastHoverLeaveAt: 0,
    dragVelocity: 0,
    autoRotateSpeed: 0,
    phase2EnteredAt: 0,
    lastInteractionAt: 0,
    hoveredPartId: null,
    selectedPartId: null,
  })

  // Pointer drag tracking ref (zero React state updates during drag)
  const dragSessionRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    maxDist: 0,
  })

  // Active Tier, Viewport, Phase UI flags, and Selected Part (only changes on discrete events)
  const [tier, setTier] = useState(() => getActiveTier())
  const [isInViewport, setIsInViewport] = useState(true)
  const [isSceneReady, setIsSceneReady] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isPhase2, setIsPhase2] = useState(false)
  const [showInteractHint, setShowInteractHint] = useState(false)
  const [hasDismissedHint, setHasDismissedHint] = useState(false)
  const [showScrollContinue, setShowScrollContinue] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
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
      window.__cinematicState = cinematicStateRef.current
      window.__interactionRef = interactionRef
      setIsDebugEnabled(window.location.search.includes('debug=cinematic'))
    }
  }, [])

  // Safety timeout for loading gate
  useEffect(() => {
    const gateTimer = setTimeout(() => {
      setIsSceneReady(true)
    }, 1200)
    return () => clearTimeout(gateTimer)
  }, [])

  const handleSceneReady = useCallback(() => {
    setIsSceneReady(true)
  }, [])

  // Track Tier changes with resize
  useEffect(() => {
    const handleResize = () => {
      const next = getActiveTier()
      setTier((prev) => (prev.name === next.name ? prev : next))
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // IntersectionObserver on outer wrapper (includes ScrollTrigger pin-spacer height)
  useEffect(() => {
    const el = wrapperRef.current || containerRef.current
    if (!el) return

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        setIsInViewport(entries[0].isIntersecting)
      },
      { rootMargin: '300px 0px', threshold: 0 }
    )

    visibilityObserver.observe(el)
    return () => visibilityObserver.disconnect()
  }, [])

  // Configure static Showcase pose immediately when prefers-reduced-motion is active
  useEffect(() => {
    if (!prefersReducedMotion) return
    const s = cinematicStateRef.current
    s.phase = 'showcase'
    s.scene = 'showcase'
    s.progress = 1.0
    s.bikeX = SHOWCASE_BIKE_POS[0]
    s.bikeY = SHOWCASE_BIKE_POS[1]
    s.bikeZ = SHOWCASE_BIKE_POS[2]
    s.bikeRotX = SHOWCASE_BIKE_ROTATION[0]
    s.bikeRotY = SHOWCASE_BIKE_ROTATION[1]
    s.bikeRotZ = SHOWCASE_BIKE_ROTATION[2]
    s.currentRotY = SHOWCASE_BIKE_ROTATION[1]
    s.targetRotY = SHOWCASE_BIKE_ROTATION[1]
    s.camX = SHOWCASE_CAMERA_POS[0]
    s.camY = SHOWCASE_CAMERA_POS[1]
    s.camZ = SHOWCASE_CAMERA_POS[2]
    s.lookX = SHOWCASE_CAMERA_LOOK_AT[0]
    s.lookY = SHOWCASE_CAMERA_LOOK_AT[1]
    s.lookZ = SHOWCASE_CAMERA_LOOK_AT[2]
    s.headlightIntensity = 4.8
    s.rimIntensity = 3.8
    s.intensity = 0.5
    s.dragVelocity = 0
    s.autoRotateSpeed = 0
    setIsPhase2(true)
    if (!hasDismissedHintRef.current) {
      setShowInteractHint(true)
    }
  }, [prefersReducedMotion])

  // Delayed "Scroll to continue ↓" indicator once Phase 2 starts
  useEffect(() => {
    if (!isPhase2 || prefersReducedMotion) {
      setShowScrollContinue(false)
      return
    }
    const timer = setTimeout(() => {
      setShowScrollContinue(true)
    }, CINEMATIC_CONFIG.rotation.scrollContinueHintDelayMs)
    return () => clearTimeout(timer)
  }, [isPhase2, prefersReducedMotion])

  // Dismiss one-time hint on first interaction
  const registerFirstInteraction = useCallback(() => {
    const s = cinematicStateRef.current
    s.lastInteractionAt = performance.now()
    if (!hasDismissedHintRef.current) {
      hasDismissedHintRef.current = true
      setHasDismissedHint(true)
      setShowInteractHint(false)
    }
  }, [])

  // Select or deselect a clickable motorcycle part
  const selectPartById = useCallback(
    (partId) => {
      const s = cinematicStateRef.current
      s.selectedPartId = partId
      s.lastInteractionAt = performance.now()
      if (!partId) {
        setSelectedPart(null)
        return
      }
      const found = CLICKABLE_PARTS.find((p) => p.id === partId) || null
      setSelectedPart(found)
    },
    []
  )

  // GSAP ScrollTrigger Master Timeline Setup (Phase 1 Approach -> Phase 2 Handoff)
  useEffect(() => {
    if (prefersReducedMotion) return

    let scrollTriggerInstance = null

    const ctx = gsap.context(() => {
      scrollTriggerInstance = createCinematicTimeline({
        container: containerRef.current,
        tier,
        cinematicStateRef,
        glowOverlayRef: glowOverlayRef.current,
        onPhaseChange: (nextPhase) => {
          const active = nextPhase === 'showcase'
          setIsPhase2(active)
          if (active && !hasDismissedHintRef.current) {
            setShowInteractHint(true)
          }
          if (!active) {
            cinematicStateRef.current.isPointerHovering = false
            cinematicStateRef.current.hoveredPartId = null
            cinematicStateRef.current.selectedPartId = null
            setSelectedPart(null)
          }
        },
        onProgressUpdate: isDebugEnabled
          ? (progress, scene, bikeZ, rotY, intensity) => {
              if (debugSceneRef.current) debugSceneRef.current.textContent = scene
              if (debugProgressRef.current)
                debugProgressRef.current.textContent = (progress * 100).toFixed(1) + '%'
              if (debugBikeZRef.current)
                debugBikeZRef.current.textContent = bikeZ.toFixed(2)
              if (debugRotRef.current)
                debugRotRef.current.textContent =
                  Math.round((rotY * 180) / Math.PI) + '°'
              if (debugIntensityRef.current)
                debugIntensityRef.current.textContent = intensity.toFixed(2)
            }
          : null,
      })
      scrollTriggerRef.current = scrollTriggerInstance
    }, containerRef)

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 150)

    return () => {
      clearTimeout(refreshTimer)
      if (scrollTriggerInstance) {
        scrollTriggerInstance.kill()
      }
      scrollTriggerRef.current = null
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
      if (debugRotRef.current && cinematicStateRef.current) {
        debugRotRef.current.textContent =
          Math.round((cinematicStateRef.current.currentRotY * 180) / Math.PI) + '°'
      }
      animId = requestAnimationFrame(calcFps)
    }

    animId = requestAnimationFrame(calcFps)
    return () => cancelAnimationFrame(animId)
  }, [isDebugEnabled])

  // ================= PHASE 2 & 3 POINTER HANDLERS (Zero State Updates on Move/Hover) =================
  const handlePointerEnter = useCallback(
    (e) => {
      // Do not pause on mobile/touch (no hover event there)
      if (e.pointerType === 'touch' || tier.name === 'mobile') return
      const s = cinematicStateRef.current
      s.isPointerHovering = true
    },
    [tier.name]
  )

  const handlePointerLeave = useCallback(
    (e) => {
      if (e.pointerType === 'touch' || tier.name === 'mobile') return
      const s = cinematicStateRef.current
      if (s.isPointerHovering) {
        s.isPointerHovering = false
        s.lastHoverLeaveAt = performance.now()
      }
      s.hoveredPartId = null
      if (interactiveStageRef.current && !s.isDragging) {
        interactiveStageRef.current.style.cursor = 'grab'
      }
    },
    [tier.name]
  )

  const handlePointerDown = useCallback(
    (e) => {
      const s = cinematicStateRef.current
      if (s.phase !== 'showcase') return

      // Ignore clicks on child UI buttons/links
      if (e.target.closest('[data-ui-interactive="true"]')) return

      const session = dragSessionRef.current
      session.active = true
      session.pointerId = e.pointerId
      session.startX = e.clientX
      session.startY = e.clientY
      session.lastX = e.clientX
      session.lastTime = performance.now()
      session.maxDist = 0

      s.isDragging = true
      s.dragVelocity = 0
      s.autoRotateSpeed = 0
      s.lastInteractionAt = session.lastTime

      if (interactiveStageRef.current) {
        interactiveStageRef.current.style.cursor = 'grabbing'
        try {
          interactiveStageRef.current.setPointerCapture(e.pointerId)
        } catch {
          // Ignore pointer capture errors on synthetic events
        }
      }
    },
    []
  )

  const handlePointerMove = useCallback(
    (e) => {
      const s = cinematicStateRef.current
      if (s.phase !== 'showcase') return

      // Track non-touch pointer hover over the 3D canvas/model area via ref (zero React re-renders)
      if (e.pointerType !== 'touch' && tier.name !== 'mobile') {
        s.isPointerHovering = true
      }

      const session = dragSessionRef.current
      if (session.active) {
        const now = performance.now()
        const dt = Math.max(0.004, (now - session.lastTime) / 1000)
        const dx = e.clientX - session.lastX
        const totalDist = Math.hypot(
          e.clientX - session.startX,
          e.clientY - session.startY
        )
        session.maxDist = Math.max(session.maxDist, totalDist)

        if (totalDist > 4) {
          registerFirstInteraction()
        }

        const sensitivity =
          e.pointerType === 'touch' || tier.name !== 'desktop'
            ? CINEMATIC_CONFIG.rotation.dragSensitivityTouch
            : CINEMATIC_CONFIG.rotation.dragSensitivityDesktop

        const deltaAngle = dx * sensitivity
        s.targetRotY += deltaAngle
        s.dragVelocity = prefersReducedMotion ? 0 : (deltaAngle / dt) * 0.45
        s.lastInteractionAt = now

        session.lastX = e.clientX
        session.lastTime = now
        return
      }

      // Desktop hover raycasting (no hover on mobile/touch)
      if (tier.name === 'desktop' && e.pointerType !== 'touch') {
        const hitPartId =
          interactionRef.current?.raycastClientXY?.(e.clientX, e.clientY) || null
        s.hoveredPartId = hitPartId
        if (interactiveStageRef.current) {
          interactiveStageRef.current.style.cursor = hitPartId ? 'pointer' : 'grab'
        }
      }
    },
    [tier.name, prefersReducedMotion, registerFirstInteraction]
  )

  const handlePointerUpOrCancel = useCallback(
    (e) => {
      const s = cinematicStateRef.current
      const session = dragSessionRef.current
      if (!session.active) return

      const wasClick = session.maxDist < 6
      session.active = false
      s.isDragging = false
      s.lastInteractionAt = performance.now()

      if (interactiveStageRef.current) {
        try {
          if (session.pointerId !== null) {
            interactiveStageRef.current.releasePointerCapture(session.pointerId)
          }
        } catch {
          // Ignore release capture errors
        }
      }

      if (wasClick && s.phase === 'showcase') {
        const hitPartId =
          interactionRef.current?.raycastClientXY?.(e.clientX, e.clientY) || null
        if (hitPartId) {
          registerFirstInteraction()
          selectPartById(hitPartId)
        } else {
          selectPartById(null)
        }
      }

      if (interactiveStageRef.current) {
        interactiveStageRef.current.style.cursor = s.hoveredPartId
          ? 'pointer'
          : 'grab'
      }
    },
    [registerFirstInteraction, selectPartById]
  )

  const handleScrollToContinue = useCallback(() => {
    const st = scrollTriggerRef.current
    const targetY = st
      ? st.end + 48
      : (containerRef.current?.offsetTop || 0) + window.innerHeight
    if (typeof window !== 'undefined' && window.__lenis) {
      window.__lenis.scrollTo(targetY)
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: targetY, behavior: 'smooth' })
    }
  }, [])

  return (
    <div ref={wrapperRef} className="w-full bg-zinc-950">
      <section
        ref={containerRef}
        aria-label="AirTouch Engineering 3D Motorcycle Showcase"
        className="cinematic-pinned-container"
      >
        {/* Layer 1: Dark atmospheric base */}
        <div className="absolute inset-0 w-full h-full bg-zinc-950 pointer-events-none z-0" />

        {/* Layer 2: Real-time 3D React Three Fiber Scene */}
        <Suspense fallback={null}>
          <CinematicCanvas
            tier={tier}
            cinematicStateRef={cinematicStateRef}
            interactionRef={interactionRef}
            floatingLabelRef={floatingLabelRef}
            mobileDotRefs={mobileDotRefs}
            prefersReducedMotion={prefersReducedMotion}
            isInViewport={isInViewport}
            onSceneReady={handleSceneReady}
          />
        </Suspense>

        {/* Short Pre-Compile Loading Curtain */}
        <div
          className={`absolute inset-0 bg-zinc-950 pointer-events-none z-12 transition-opacity duration-500 ${
            isSceneReady ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        />

        {/* Layer 3: Color Grade + Vignette Overlay */}
        <div className="cinematic-vignette-overlay" aria-hidden="true" />

        {/* Layer 4: Dynamic Orange Radial Glow Overlay */}
        <div
          ref={glowOverlayRef}
          className="cinematic-glow-overlay"
          aria-hidden="true"
        />

        {/* Layer 5: Interactive Pointer & Part Inspection Stage (Active in Phase 2) */}
        <div
          ref={interactiveStageRef}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          style={{ cursor: isPhase2 ? 'grab' : 'default' }}
          className={`cinematic-interactive-stage ${
            isPhase2 ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          {/* One-Time Entry Hint: "Drag to rotate · Tap a part to shop" */}
          {isPhase2 && showInteractHint && !hasDismissedHint && (
            <div
              data-testid="showcase-hint"
              className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 z-30 w-max max-w-[calc(100vw-2rem)] px-4 py-2 rounded-full bg-zinc-950/85 backdrop-blur-md border border-orange-500/40 text-zinc-100 text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.65)]"
            >
              <Rotate3d className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Drag to rotate · Tap a part to shop</span>
            </div>
          )}

          {/* Mobile/Tablet Low-Opacity Pulsing Hotspot Dots in Phase 2 */}
          {isPhase2 && tier.name !== 'desktop' && (
            <div className="absolute inset-0 pointer-events-none z-30">
              {CLICKABLE_PARTS.map((part) => {
                const isSelected = selectedPart?.id === part.id
                return (
                  <button
                    key={part.id}
                    type="button"
                    data-ui-interactive="true"
                    data-part-dot={part.id}
                    ref={(el) => {
                      mobileDotRefs.current[part.id] = el
                    }}
                    aria-label={`Select ${part.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      registerFirstInteraction()
                      selectPartById(part.id)
                    }}
                    className="cinematic-hotspot-dot pointer-events-auto w-7 h-7 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                  >
                    <span
                      className={`w-3 h-3 rounded-full bg-orange-500 border border-white/80 shadow-[0_0_12px_rgba(249,115,22,0.9)] ${
                        isSelected ? 'scale-125 opacity-100' : 'cinematic-hotspot-pulse'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          )}

          {/* Floating Screen-Projected HTML Label ("Buy [Part Name] ->") */}
          <div
            ref={floatingLabelRef}
            data-testid="floating-part-label"
            className={`cinematic-floating-label transition-opacity duration-150 ${
              isPhase2 && selectedPart
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            {selectedPart && (
              <button
                type="button"
                data-ui-interactive="true"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(selectedPart.url)
                }}
                className="px-4 py-2 rounded-full bg-zinc-950/95 hover:bg-orange-500 text-white hover:text-black border border-orange-500/80 font-extrabold text-xs sm:text-sm tracking-wider uppercase inline-flex items-center gap-1.5 shadow-[0_0_24px_rgba(249,115,22,0.45)] transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                <span>Buy {selectedPart.name}</span>
                <span aria-hidden="true">→</span>
              </button>
            )}
          </div>

          {/* Keyboard-Accessible Part Selector Bar (Tab with visible focus ring + Enter to navigate) */}
          <nav
            aria-label="Interactive Motorcycle Parts"
            data-ui-interactive="true"
            className={`absolute bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 transition-opacity duration-300 ${
              isPhase2 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            {CLICKABLE_PARTS.map((part) => {
              const isSelected = selectedPart?.id === part.id
              return (
                <button
                  key={part.id}
                  type="button"
                  data-part-button={part.id}
                  tabIndex={isPhase2 ? 0 : -1}
                  onFocus={() => {
                    cinematicStateRef.current.hoveredPartId = part.id
                    selectPartById(part.id)
                  }}
                  onBlur={() => {
                    if (cinematicStateRef.current.hoveredPartId === part.id) {
                      cinematicStateRef.current.hoveredPartId = null
                    }
                  }}
                  onMouseEnter={() => {
                    cinematicStateRef.current.hoveredPartId = part.id
                  }}
                  onMouseLeave={() => {
                    if (cinematicStateRef.current.hoveredPartId === part.id) {
                      cinematicStateRef.current.hoveredPartId = null
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    registerFirstInteraction()
                    navigate(part.url)
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                    isSelected
                      ? 'bg-orange-500 text-black border border-orange-400 shadow-[0_0_14px_rgba(249,115,22,0.5)]'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 hover:border-orange-500/60'
                  }`}
                >
                  {part.name}
                </button>
              )
            })}
          </nav>

          {/* "Scroll to continue ↓" Indicator */}
          {isPhase2 && showScrollContinue && !prefersReducedMotion && (
            <button
              type="button"
              data-ui-interactive="true"
              data-testid="scroll-continue-indicator"
              onClick={handleScrollToContinue}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1 rounded-full bg-zinc-950/75 border border-zinc-800 text-zinc-300 hover:text-orange-400 hover:border-orange-500/50 text-xs font-semibold tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <span>Scroll to continue ↓</span>
              <ChevronDown className="w-3.5 h-3.5 text-orange-500 animate-bounce" />
            </button>
          )}
        </div>

        {/* Dev-Only Telemetry HUD (Only displayed when URL has ?debug=cinematic) */}
        {isDebugEnabled && (
          <aside className="cinematic-debug-hud" aria-label="Cinematic Telemetry">
            <div className="font-bold border-b border-orange-500/50 pb-1 mb-1 text-orange-400">
              AIRTOUCH 3D TELEMETRY
            </div>
            <div>
              SCENE: <span ref={debugSceneRef}>{isPhase2 ? 'showcase' : 'approach'}</span>
            </div>
            <div>
              PROGRESS: <span ref={debugProgressRef}>{isPhase2 ? '100.0%' : '0.0%'}</span>
            </div>
            <div>
              BIKE Z: <span ref={debugBikeZRef}>{isPhase2 ? '0.00' : '-11.50'}</span>
            </div>
            <div>
              ROTATION: <span ref={debugRotRef}>{isPhase2 ? '90°' : '0°'}</span>
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

      {/* Plain "Shop by part" Text-Link Fallback for prefers-reduced-motion */}
      {prefersReducedMotion && (
        <aside
          aria-label="Shop by part"
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-zinc-900 bg-zinc-950 text-white"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.2em] text-orange-500">
              Shop by part
            </h2>
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {CLICKABLE_PARTS.map((part) => (
                <li key={part.id}>
                  <Link
                    to={part.url}
                    className="text-sm font-semibold text-zinc-200 hover:text-orange-400 underline underline-offset-4 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded"
                  >
                    <span>{part.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  )
}
