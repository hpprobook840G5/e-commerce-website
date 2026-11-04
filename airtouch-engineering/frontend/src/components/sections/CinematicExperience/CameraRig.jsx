import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  SHOWCASE_CAMERA_POS,
  SHOWCASE_CAMERA_LOOK_AT,
} from './cinematicConfig.js'

/**
 * CameraRig Component
 * Smoothly damps the camera position and lookAt target toward the active state ref
 * coordinates using frame-rate-independent THREE.MathUtils.damp.
 * Settles to the exact SHOWCASE_CAMERA_POS and SHOWCASE_CAMERA_LOOK_AT at the end of Phase 1.
 * Zero object allocations inside useFrame.
 */
export default function CameraRig({ cinematicStateRef, prefersReducedMotion = false }) {
  const currentLookAt = useRef(
    new THREE.Vector3(
      SHOWCASE_CAMERA_LOOK_AT[0],
      SHOWCASE_CAMERA_LOOK_AT[1],
      SHOWCASE_CAMERA_LOOK_AT[2]
    )
  )
  const lastAspectRef = useRef(0)

  useFrame((state, rawDelta) => {
    const s = cinematicStateRef?.current
    if (!s) return

    const dt = Math.min(rawDelta, 0.05)
    const cam = state.camera
    const lambda = 9.0

    // Adapt vertical FOV on narrow portrait viewports so full side profile fits inside 375px
    // while keeping camera.position strictly at SHOWCASE_CAMERA_POS
    const aspect = state.size.width / Math.max(1, state.size.height)
    if (Math.abs(aspect - lastAspectRef.current) > 0.01) {
      lastAspectRef.current = aspect
      const baseFov = 42
      if (aspect < 1.15) {
        const baseTan = Math.tan(THREE.MathUtils.degToRad(baseFov * 0.5))
        const adjustedTan = baseTan * Math.min(2.15, 1.15 / Math.max(aspect, 0.42))
        cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(adjustedTan))
      } else {
        cam.fov = baseFov
      }
      cam.updateProjectionMatrix()
    }

    const targetCamX = s.camX ?? SHOWCASE_CAMERA_POS[0]
    const targetCamY = s.camY ?? SHOWCASE_CAMERA_POS[1]
    const targetCamZ = s.camZ ?? SHOWCASE_CAMERA_POS[2]

    const targetLookX = s.lookX ?? SHOWCASE_CAMERA_LOOK_AT[0]
    const targetLookY = s.lookY ?? SHOWCASE_CAMERA_LOOK_AT[1]
    const targetLookZ = s.lookZ ?? SHOWCASE_CAMERA_LOOK_AT[2]

    if (prefersReducedMotion) {
      cam.position.set(targetCamX, targetCamY, targetCamZ)
      currentLookAt.current.set(targetLookX, targetLookY, targetLookZ)
    } else {
      cam.position.x = THREE.MathUtils.damp(cam.position.x, targetCamX, lambda, dt)
      cam.position.y = THREE.MathUtils.damp(cam.position.y, targetCamY, lambda, dt)
      cam.position.z = THREE.MathUtils.damp(cam.position.z, targetCamZ, lambda, dt)

      const look = currentLookAt.current
      look.x = THREE.MathUtils.damp(look.x, targetLookX, lambda, dt)
      look.y = THREE.MathUtils.damp(look.y, targetLookY, lambda, dt)
      look.z = THREE.MathUtils.damp(look.z, targetLookZ, lambda, dt)
    }

    cam.lookAt(currentLookAt.current)
  })

  return null
}
