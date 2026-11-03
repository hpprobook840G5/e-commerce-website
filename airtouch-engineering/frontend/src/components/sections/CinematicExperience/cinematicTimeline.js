import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import { CINEMATIC_CONFIG } from './cinematicConfig.js'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

/**
 * Creates the master GSAP ScrollTrigger timeline driving:
 * - Continuous Catmull-Rom 3D splines for Camera position, Camera lookAt, and Motorcycle position
 * - Smoothly eased motorcycle yaw/roll & lighting intensities
 * - Overlapping GPU-accelerated storyboard text panels (force3D: true)
 * - Zero object allocations inside onUpdate
 */
export function createCinematicTimeline({
  container,
  tier,
  cinematicStateRef,
  glowOverlayRef,
  panelsContainerRef,
  exitOverlayRef,
  onProgressUpdate,
}) {
  if (!container) return null

  const curveSet =
    tier.name === 'mobile'
      ? CINEMATIC_CONFIG.curves.mobile
      : CINEMATIC_CONFIG.curves.desktop

  // Pre-build continuous centripetal Catmull-Rom splines once
  const cameraPosCurve = new THREE.CatmullRomCurve3(
    curveSet.cameraPosition.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    false,
    'centripetal',
    0.5
  )

  const cameraLookCurve = new THREE.CatmullRomCurve3(
    curveSet.cameraLookAt.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    false,
    'centripetal',
    0.5
  )

  const bikePosCurve = new THREE.CatmullRomCurve3(
    curveSet.bikePosition.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    false,
    'centripetal',
    0.5
  )

  // Reusable scratch vectors (zero GC allocations during scroll)
  const tmpCamPos = new THREE.Vector3()
  const tmpCamLook = new THREE.Vector3()
  const tmpBikePos = new THREE.Vector3()

  // Scalar proxy tweened with smooth eases (no linear 'none' jumps)
  const proxy = {
    bikeRotX: 0,
    bikeRotY: 0,
    bikeRotZ: 0,
    headlightIntensity: 2.2,
    rimIntensity: 2.4,
    intensity: 0.35,
  }

  // Target DOM story panels inside StoryPanels component
  const p1 = panelsContainerRef?.querySelector('.story-panel-1')
  const p2 = panelsContainerRef?.querySelector('.story-panel-2')
  const p3 = panelsContainerRef?.querySelector('.story-panel-3')
  const p4 = panelsContainerRef?.querySelector('.story-panel-4')

  // Create Master Timeline (normalized 0.0 to 1.0)
  const masterTimeline = gsap.timeline({
    paused: true,
    defaults: { ease: 'sine.inOut', force3D: true },
    onUpdate: () => {
      const progress = Math.max(0, Math.min(1, masterTimeline.progress()))

      // Determine active scene label
      let scene = 'roadIntro'
      if (progress < 0.15) scene = 'roadIntro'
      else if (progress < 0.4) scene = 'riderReveal'
      else if (progress < 0.6) scene = 'showcase'
      else if (progress < 0.8) scene = 'brandIntro'
      else scene = 'transition'

      // Sample continuous 3D splines into pre-allocated scratch vectors
      cameraPosCurve.getPointAt(progress, tmpCamPos)
      cameraLookCurve.getPointAt(progress, tmpCamLook)
      bikePosCurve.getPoint(progress, tmpBikePos)

      // Mutate shared state ref in-place (zero object allocation)
      if (cinematicStateRef && cinematicStateRef.current) {
        const s = cinematicStateRef.current
        s.progress = progress
        s.scene = scene
        s.bikeX = tmpBikePos.x
        s.bikeY = tmpBikePos.y
        s.bikeZ = tmpBikePos.z
        s.bikeRotX = proxy.bikeRotX
        s.bikeRotY = proxy.bikeRotY
        s.bikeRotZ = proxy.bikeRotZ
        s.camX = tmpCamPos.x
        s.camY = tmpCamPos.y
        s.camZ = tmpCamPos.z
        s.lookX = tmpCamLook.x
        s.lookY = tmpCamLook.y
        s.lookZ = tmpCamLook.z
        s.headlightIntensity = proxy.headlightIntensity
        s.rimIntensity = proxy.rimIntensity
        s.intensity = proxy.intensity
      }

      if (onProgressUpdate) {
        onProgressUpdate(progress, scene, tmpBikePos.z, proxy.bikeRotY, proxy.intensity)
      }
    },
  })

  // Timeline labels
  masterTimeline
    .addLabel('roadIntro', 0.0)
    .addLabel('motorcycleReveal', 0.15)
    .addLabel('productShowcase', 0.4)
    .addLabel('brandIntro', 0.6)
    .addLabel('productTransition', 0.8)

  // ================= SCENE 1: ROAD INTRO (0.00 – 0.15) =================
  masterTimeline.to(
    proxy,
    {
      bikeRotY: -0.14,
      bikeRotZ: 0.015,
      headlightIntensity: 4.5,
      rimIntensity: 3.2,
      intensity: 0.6,
      duration: 0.15,
      ease: 'sine.inOut',
    },
    0.0
  )

  if (p1) {
    masterTimeline
      .fromTo(
        p1,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out', force3D: true },
        0.0
      )
      .to(
        p1,
        { opacity: 0, y: -14, duration: 0.05, ease: 'power2.in', force3D: true },
        0.12
      )
  }

  // ================= SCENE 2: MOTORCYCLE REVEAL (0.15 – 0.40) =================
  masterTimeline.to(
    proxy,
    {
      bikeRotY: -0.38,
      bikeRotZ: 0.035,
      headlightIntensity: 6.8,
      rimIntensity: 4.2,
      intensity: 1.0,
      duration: 0.25,
      ease: 'power2.inOut',
    },
    0.15
  )

  // ================= SCENE 3: CINEMATIC SHOWCASE (0.40 – 0.60) =================
  masterTimeline.to(
    proxy,
    {
      bikeRotY: 0.72,
      bikeRotZ: 0.0,
      headlightIntensity: 5.0,
      rimIntensity: 3.8,
      intensity: 0.75,
      duration: 0.2,
      ease: 'sine.inOut',
    },
    0.4
  )

  // Panel 2 overlaps camera sweep (0.36 enter, 0.56 exit)
  if (p2) {
    masterTimeline
      .fromTo(
        p2,
        { opacity: 0, x: -28 },
        { opacity: 1, x: 0, duration: 0.06, ease: 'power2.out', force3D: true },
        0.36
      )
      .to(
        p2,
        { opacity: 0, x: -20, duration: 0.05, ease: 'power2.in', force3D: true },
        0.56
      )
  }

  // ================= SCENE 4: BRAND INTRODUCTION (0.60 – 0.80) =================
  masterTimeline.to(
    proxy,
    {
      bikeRotY: 1.22,
      bikeRotZ: -0.015,
      headlightIntensity: 4.2,
      rimIntensity: 3.5,
      intensity: 0.75,
      duration: 0.2,
      ease: 'sine.inOut',
    },
    0.6
  )

  // Panel 3 overlaps transition into Scene 4 (0.58 enter, 0.76 exit)
  if (p3) {
    masterTimeline
      .fromTo(
        p3,
        { opacity: 0, x: 28 },
        { opacity: 1, x: 0, duration: 0.06, ease: 'power2.out', force3D: true },
        0.58
      )
      .to(
        p3,
        { opacity: 0, x: 20, duration: 0.05, ease: 'power2.in', force3D: true },
        0.76
      )
  }

  // ================= SCENE 5: PRODUCT TRANSITION (0.80 – 1.00) =================
  masterTimeline.to(
    proxy,
    {
      bikeRotY: 0.0,
      bikeRotZ: 0.0,
      headlightIntensity: 2.4,
      rimIntensity: 2.0,
      intensity: 0.25,
      duration: 0.2,
      ease: 'power2.inOut',
    },
    0.8
  )

  // Panel 4 overlaps Scene 5 launch (0.79 enter, 0.96 exit)
  if (p4) {
    masterTimeline
      .fromTo(
        p4,
        { opacity: 0, y: 24, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1.0, duration: 0.06, ease: 'power2.out', force3D: true },
        0.79
      )
      .to(
        p4,
        { opacity: 0, y: -16, duration: 0.04, ease: 'power2.in', force3D: true },
        0.96
      )
  }

  // Glow overlay modulation
  if (glowOverlayRef) {
    masterTimeline
      .fromTo(
        glowOverlayRef,
        { opacity: 0.15 },
        { opacity: 0.6, duration: 0.25, ease: 'sine.inOut' },
        0.15
      )
      .to(glowOverlayRef, { opacity: 0.38, duration: 0.3, ease: 'sine.inOut' }, 0.4)
      .to(glowOverlayRef, { opacity: 0.0, duration: 0.2, ease: 'sine.inOut' }, 0.8)
  }

  // Background fade overlay to page background (#09090b) towards unpinning
  if (exitOverlayRef) {
    masterTimeline.fromTo(
      exitOverlayRef,
      { opacity: 0 },
      { opacity: 0.96, duration: 0.14, ease: 'sine.inOut' },
      0.86
    )
  }

  // Single ScrollTrigger to pin the container and scrub master timeline
  const st = ScrollTrigger.create({
    trigger: container,
    start: 'top top',
    end: tier.pinLength,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    animation: masterTimeline,
  })

  return st
}
