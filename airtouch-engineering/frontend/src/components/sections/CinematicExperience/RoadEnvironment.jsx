import { useMemo, useEffect } from 'react'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Wet-Asphalt Road Environment Component
 * - Uses drei MeshReflectorMaterial on desktop (512) and tablet (256) for real-time
 *   wet-asphalt reflections of the motorcycle, headlight, and orange rim lights
 * - Falls back to standard dark asphalt on mobile or when disabled by PerformanceMonitor
 * - Preserves orange center highway dashes and shoulder markings
 */
export default function RoadEnvironment({ tier, reflectorEnabled = true }) {
  const roadWidth = 16
  const roadLength = 120

  const useReflector =
    tier?.name !== 'mobile' &&
    tier?.enableReflector !== false &&
    reflectorEnabled

  const reflectorRes = tier?.reflectorResolution || 512

  // Precompute dashed line Z positions and shared geometry/material
  const { dashedLines, dashGeo, dashMat, shoulderGeo, shoulderMat } = useMemo(() => {
    const lines = []
    const dashLength = 2.5
    const gap = 3.5
    const count = Math.floor(roadLength / (dashLength + gap))
    const startZ = -roadLength / 2

    for (let i = 0; i < count; i++) {
      lines.push(startZ + i * (dashLength + gap))
    }

    return {
      dashedLines: lines,
      dashGeo: new THREE.PlaneGeometry(0.18, 2.5),
      dashMat: new THREE.MeshBasicMaterial({
        color: new THREE.Color('#f97316'),
        transparent: true,
        opacity: 0.65,
      }),
      shoulderGeo: new THREE.PlaneGeometry(0.15, roadLength),
      shoulderMat: new THREE.MeshBasicMaterial({
        color: new THREE.Color('#3f3f46'),
        transparent: true,
        opacity: 0.55,
      }),
    }
  }, [roadLength])

  // Clean up shared geometries & materials on unmount
  useEffect(() => {
    return () => {
      dashGeo.dispose()
      dashMat.dispose()
      shoulderGeo.dispose()
      shoulderMat.dispose()
    }
  }, [dashGeo, dashMat, shoulderGeo, shoulderMat])

  return (
    <group position={[0, -0.005, 0]}>
      {/* 1. Main Wet-Asphalt Surface Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roadWidth, roadLength]} />
        {useReflector ? (
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={reflectorRes}
            mixBlur={1}
            mixStrength={0.75}
            roughness={0.78}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#050507"
            metalness={0.55}
            envMapIntensity={0.12}
            mirror={0}
          />
        ) : (
          <meshStandardMaterial
            color="#050507"
            roughness={0.6}
            metalness={0.4}
            envMapIntensity={0.15}
          />
        )}
      </mesh>

      {/* 2. Side Shoulder Strips */}
      <mesh
        position={[-roadWidth / 2 + 0.3, 0.003, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={shoulderGeo}
        material={shoulderMat}
      />
      <mesh
        position={[roadWidth / 2 - 0.3, 0.003, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={shoulderGeo}
        material={shoulderMat}
      />

      {/* 3. Center Dashed Highway Line (AirTouch Orange) */}
      {dashedLines.map((z, idx) => (
        <mesh
          key={idx}
          position={[0, 0.004, z]}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={dashGeo}
          material={dashMat}
        />
      ))}
    </group>
  )
}
