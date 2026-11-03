import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * CameraRig Component
 * Smoothly damps the camera position and lookAt target toward the continuous
 * Catmull-Rom spline coordinates using frame-rate-independent THREE.MathUtils.damp.
 * Zero object allocations inside useFrame.
 */
export default function CameraRig({ cinematicStateRef, mouseRef, tier }) {
  const currentLookAt = useRef(new THREE.Vector3(0, 0.75, -7.5))
  const dampedParallax = useRef({ x: 0, y: 0 })

  useFrame((state, rawDelta) => {
    if (!cinematicStateRef.current) return

    // Clamp delta to prevent jumps after tab switches or frame stalls
    const dt = Math.min(rawDelta, 0.05)
    const s = cinematicStateRef.current
    const lambda = 7

    // Subtle damped cursor parallax on desktop only
    const rawMx =
      tier.name === 'desktop' && mouseRef?.current ? mouseRef.current.x * 0.12 : 0
    const rawMy =
      tier.name === 'desktop' && mouseRef?.current ? mouseRef.current.y * 0.07 : 0

    dampedParallax.current.x = THREE.MathUtils.damp(
      dampedParallax.current.x,
      rawMx,
      5,
      dt
    )
    dampedParallax.current.y = THREE.MathUtils.damp(
      dampedParallax.current.y,
      rawMy,
      5,
      dt
    )

    // Frame-rate-independent damping toward spline camera position
    const cam = state.camera
    cam.position.x = THREE.MathUtils.damp(
      cam.position.x,
      (s.camX ?? 0) + dampedParallax.current.x,
      lambda,
      dt
    )
    cam.position.y = THREE.MathUtils.damp(
      cam.position.y,
      (s.camY ?? 0.65) + dampedParallax.current.y,
      lambda,
      dt
    )
    cam.position.z = THREE.MathUtils.damp(
      cam.position.z,
      s.camZ ?? 3.8,
      lambda,
      dt
    )

    // Frame-rate-independent damping toward spline lookAt target
    const look = currentLookAt.current
    look.x = THREE.MathUtils.damp(look.x, s.lookX ?? 0, lambda, dt)
    look.y = THREE.MathUtils.damp(look.y, s.lookY ?? 0.68, lambda, dt)
    look.z = THREE.MathUtils.damp(look.z, s.lookZ ?? 0, lambda, dt)

    cam.lookAt(look)
  })

  return null
}
