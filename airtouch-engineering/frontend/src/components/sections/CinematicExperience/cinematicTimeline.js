import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import {
  CINEMATIC_CONFIG,
  SHOWCASE_CAMERA_POS,
  SHOWCASE_CAMERA_LOOK_AT,
  SHOWCASE_BIKE_POS,
  SHOWCASE_BIKE_ROTATION,
} from './cinematicConfig.js'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

/**
 * Creates the Phase 1 Approach GSAP ScrollTrigger timeline:
 * - Scrubs the motorcycle from far down the highway into the exact Showcase pose
 *   (SHOWCASE_CAMERA_POS, SHOWCASE_BIKE_POS, SHOWCASE_BIKE_ROTATION)
 * - Hands off seamlessly to Phase 2 (pointer-driven 360° rotation) once Phase 1 completes
 * - Scroll no longer mutates bike rotation or position after Phase 1 ends
 * - Zero object allocations inside onUpdate
 */
export function createCinematicTimeline({
  container,
  tier,
  cinematicStateRef,
  glowOverlayRef,
  onPhaseChange,
  onProgressUpdate,
}) {
  if (!container) return null

  const { approachCurves, phase1EndProgress } = CINEMATIC_CONFIG

  // Pre-build continuous centripetal Catmull-Rom splines once
  const cameraPosCurve = new THREE.CatmullRomCurve3(
    approachCurves.cameraPosition.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    false,
    'centripetal',
    0.5
  )

  const cameraLookCurve = new THREE.CatmullRomCurve3(
    approachCurves.cameraLookAt.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    false,
    'centripetal',
    0.5
  )

  const bikePosCurve = new THREE.CatmullRomCurve3(
    approachCurves.bikePosition.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    false,
    'centripetal',
    0.5
  )

  // Reusable scratch vectors (zero GC allocations during scroll)
  const tmpCamPos = new THREE.Vector3()
  const tmpCamLook = new THREE.Vector3()
  const tmpBikePos = new THREE.Vector3()

  // Smoothly eased scalar proxy for Phase 1 approach
  const proxy = {
    splineT: 0,
    bikeRotX: 0,
    bikeRotY: 0,
    bikeRotZ: 0,
    headlightIntensity: 2.2,
    rimIntensity: 2.4,
    intensity: 0.35,
  }

  const masterTimeline = gsap.timeline({
    paused: true,
    defaults: { ease: 'sine.inOut', force3D: true },
    onUpdate: () => {
      const rawProgress = Math.max(0, Math.min(1, masterTimeline.progress()))
      const s = cinematicStateRef?.current
      if (!s) return

      // Phase 1 completes at phase1EndProgress (0.72 of pinned scroll)
      if (rawProgress < phase1EndProgress) {
        // Hysteresis when scrolling slightly backward inside Phase 2 buffer
        if (s.phase === 'showcase' && rawProgress >= phase1EndProgress - 0.04) {
          if (onProgressUpdate) {
            onProgressUpdate(1.0, 'showcase', s.bikeZ, s.currentRotY, s.intensity)
          }
          return
        }

        // Transitioning back into Phase 1 when user scrolls back up toward top
        if (s.phase === 'showcase') {
          s.phase = 'approach'
          // Wrap currentRotY to nearest revolution around SHOWCASE_BIKE_ROTATION[1] to avoid multi-turn unwind
          const twoPi = Math.PI * 2
          const baseRot = SHOWCASE_BIKE_ROTATION[1]
          const diff = ((s.currentRotY - baseRot + Math.PI) % twoPi + twoPi) % twoPi - Math.PI
          s.currentRotY = baseRot + diff
          s.dragVelocity = 0
          s.autoRotateSpeed = 0
          if (onPhaseChange) onPhaseChange('approach')
        }

        const t = Math.max(0, Math.min(1, proxy.splineT))
        cameraPosCurve.getPointAt(t, tmpCamPos)
        cameraLookCurve.getPointAt(t, tmpCamLook)
        bikePosCurve.getPointAt(t, tmpBikePos)

        s.progress = rawProgress / phase1EndProgress
        s.scene = 'approach'
        s.bikeX = tmpBikePos.x
        s.bikeY = tmpBikePos.y
        s.bikeZ = tmpBikePos.z
        s.bikeRotX = proxy.bikeRotX
        s.bikeRotY = proxy.bikeRotY
        s.bikeRotZ = proxy.bikeRotZ
        s.targetRotY = proxy.bikeRotY
        s.camX = tmpCamPos.x
        s.camY = tmpCamPos.y
        s.camZ = tmpCamPos.z
        s.lookX = tmpCamLook.x
        s.lookY = tmpCamLook.y
        s.lookZ = tmpCamLook.z
        s.headlightIntensity = proxy.headlightIntensity
        s.rimIntensity = proxy.rimIntensity
        s.intensity = proxy.intensity

        if (onProgressUpdate) {
          onProgressUpdate(s.progress, 'approach', s.bikeZ, s.currentRotY, s.intensity)
        }
      } else {
        // ================= PHASE 1 ENDED -> LOCK SHOWCASE POSE & HAND OFF TO PHASE 2 =================
        s.progress = 1.0
        s.scene = 'showcase'

        // Exact showcase position & camera constants
        s.bikeX = SHOWCASE_BIKE_POS[0]
        s.bikeY = SHOWCASE_BIKE_POS[1]
        s.bikeZ = SHOWCASE_BIKE_POS[2]
        s.bikeRotX = SHOWCASE_BIKE_ROTATION[0]
        s.bikeRotZ = SHOWCASE_BIKE_ROTATION[2]

        s.camX = SHOWCASE_CAMERA_POS[0]
        s.camY = SHOWCASE_CAMERA_POS[1]
        s.camZ = SHOWCASE_CAMERA_POS[2]
        s.lookX = SHOWCASE_CAMERA_LOOK_AT[0]
        s.lookY = SHOWCASE_CAMERA_LOOK_AT[1]
        s.lookZ = SHOWCASE_CAMERA_LOOK_AT[2]

        s.headlightIntensity = 4.8
        s.rimIntensity = 3.8
        s.intensity = 0.68

        // Seamless one-time handoff from ScrollTrigger to pointer rotation
        if (s.phase !== 'showcase') {
          s.phase = 'showcase'
          s.bikeRotY = SHOWCASE_BIKE_ROTATION[1]
          s.targetRotY = SHOWCASE_BIKE_ROTATION[1]
          s.dragVelocity = 0
          s.autoRotateSpeed = 0
          const now = performance.now()
          s.phase2EnteredAt = now
          s.lastInteractionAt = now
          if (onPhaseChange) onPhaseChange('showcase')
        }

        if (onProgressUpdate) {
          onProgressUpdate(1.0, 'showcase', s.bikeZ, s.currentRotY, s.intensity)
        }
      }
    },
  })

  // Phase 1A (0.00 -> 0.42): Highway approach with particle & headlight build-up
  masterTimeline.to(
    proxy,
    {
      splineT: 0.62,
      bikeRotY: 0.18,
      bikeRotZ: -0.025,
      headlightIntensity: 6.2,
      rimIntensity: 4.2,
      intensity: 0.92,
      duration: phase1EndProgress * 0.58,
      ease: 'sine.inOut',
    },
    0.0
  )

  // Phase 1B (0.42 -> 0.72): Smooth turn into exact full side-profile Showcase pose
  masterTimeline.to(
    proxy,
    {
      splineT: 1.0,
      bikeRotX: SHOWCASE_BIKE_ROTATION[0],
      bikeRotY: SHOWCASE_BIKE_ROTATION[1],
      bikeRotZ: SHOWCASE_BIKE_ROTATION[2],
      headlightIntensity: 4.8,
      rimIntensity: 3.8,
      intensity: 0.68,
      duration: phase1EndProgress * 0.42,
      ease: 'power2.inOut',
    },
    phase1EndProgress * 0.58
  )

  // Phase 2 Pinned Buffer (0.72 -> 1.00): Keeps timeline duration normalized to 1.0
  // while scroll no longer mutates bike pose
  masterTimeline.to(
    proxy,
    {
      splineT: 1.0,
      duration: 1.0 - phase1EndProgress,
      ease: 'sine.inOut',
    },
    phase1EndProgress
  )

  // Glow overlay modulation during Phase 1 approach
  if (glowOverlayRef) {
    masterTimeline
      .fromTo(
        glowOverlayRef,
        { opacity: 0.15 },
        { opacity: 0.55, duration: phase1EndProgress * 0.6, ease: 'sine.inOut' },
        0.0
      )
      .to(
        glowOverlayRef,
        { opacity: 0.35, duration: phase1EndProgress * 0.4, ease: 'sine.inOut' },
        phase1EndProgress * 0.6
      )
  }

  const st = ScrollTrigger.create({
    trigger: container,
    start: 'top top',
    end: tier.pinLength,
    pin: true,
    scrub: 0.65,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    animation: masterTimeline,
  })

  return st
}
