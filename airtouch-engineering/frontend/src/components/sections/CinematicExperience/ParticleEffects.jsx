import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Procedural circular glow texture generator
 */
function createGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.25, 'rgba(249, 115, 22, 0.9)')
  gradient.addColorStop(0.6, 'rgba(220, 38, 38, 0.3)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

/**
 * Procedural soft smoke puff texture generator
 */
function createSmokeTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(120, 113, 108, 0.22)')
  gradient.addColorStop(0.5, 'rgba(68, 64, 60, 0.1)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export default function ParticleEffects({ tier, effectsStateRef }) {
  const glowTexture = useMemo(() => createGlowTexture(), [])
  const smokeTexture = useMemo(() => createSmokeTexture(), [])

  const embersCount = tier.particles.embers
  const sparksCount = tier.particles.sparks
  const enableSmoke = tier.particles.enableSmoke

  // ================= 1. EMBERS SYSTEM =================
  const embersPointsRef = useRef(null)
  const embersData = useMemo(() => {
    const positions = new Float32Array(embersCount * 3)
    const velocities = new Float32Array(embersCount * 3)
    const baseColors = new Float32Array(embersCount * 3)

    // HDR-boosted ember colors (>1.0) so Bloom picks them up cleanly
    const color1 = new THREE.Color('#f97316').multiplyScalar(1.6)
    const color2 = new THREE.Color('#fbbf24').multiplyScalar(1.8)
    const color3 = new THREE.Color('#ef4444').multiplyScalar(1.4)

    for (let i = 0; i < embersCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 14
      positions[i * 3 + 1] = Math.random() * 5.0 + 0.05
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10

      velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.35
      velocities[i * 3 + 1] = 0.35 + Math.random() * 0.75
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3

      const mixedColor = i % 3 === 0 ? color1 : i % 3 === 1 ? color2 : color3
      baseColors[i * 3 + 0] = mixedColor.r
      baseColors[i * 3 + 1] = mixedColor.g
      baseColors[i * 3 + 2] = mixedColor.b
    }

    return { positions, velocities, baseColors }
  }, [embersCount])

  // ================= 2. SPARKS POOL SYSTEM =================
  const sparksPointsRef = useRef(null)
  const sparksPool = useMemo(() => {
    const positions = new Float32Array(sparksCount * 3)
    const velocities = new Float32Array(sparksCount * 3)
    const life = new Float32Array(sparksCount)
    const maxLife = new Float32Array(sparksCount)

    for (let i = 0; i < sparksCount; i++) {
      positions[i * 3 + 0] = 0
      positions[i * 3 + 1] = -999
      positions[i * 3 + 2] = 0
      life[i] = 1.0
      maxLife[i] = 0.3 + Math.random() * 0.4
    }

    return { positions, velocities, life, maxLife, nextIndex: 0 }
  }, [sparksCount])

  // ================= 3. SMOKE SPRITES =================
  const smokeGroupRef = useRef(null)

  // ================= USEFRAME RUNTIME ANIMATION (Zero Allocations) =================
  useFrame((state, delta) => {
    const s = effectsStateRef.current
    const intensity = s ? s.intensity : 0.5
    const bikeX = s ? s.bikeX || 0 : 0
    const bikeZ = s ? s.bikeZ || 0 : 0
    const dt = Math.min(delta, 0.05)

    // A. Update Embers
    if (embersPointsRef.current) {
      const geo = embersPointsRef.current.geometry
      const posAttr = geo.attributes.position
      const pos = posAttr.array
      const vel = embersData.velocities

      for (let i = 0; i < embersCount; i++) {
        const i3 = i * 3
        pos[i3 + 0] += vel[i3 + 0] * dt * (0.8 + intensity * 0.4)
        pos[i3 + 1] += vel[i3 + 1] * dt * (0.8 + intensity * 0.6)
        pos[i3 + 2] += vel[i3 + 2] * dt

        if (pos[i3 + 1] > 5.0) {
          pos[i3 + 1] = 0.05
          pos[i3 + 0] = (Math.random() - 0.5) * 14
        }
      }
      posAttr.needsUpdate = true
      embersPointsRef.current.material.opacity = THREE.MathUtils.damp(
        embersPointsRef.current.material.opacity,
        Math.max(0.15, Math.min(0.95, 0.25 + intensity * 0.65)),
        6,
        dt
      )
    }

    // B. Spawn and update Sparks near rear wheel contact zone
    if (sparksPointsRef.current) {
      const geo = sparksPointsRef.current.geometry
      const posAttr = geo.attributes.position
      const pos = posAttr.array
      const { velocities, life, maxLife } = sparksPool

      const spawnRate = Math.floor(intensity * 3)
      for (let sp = 0; sp < spawnRate; sp++) {
        const idx = sparksPool.nextIndex
        sparksPool.nextIndex = (sparksPool.nextIndex + 1) % sparksCount

        if (life[idx] >= maxLife[idx]) {
          pos[idx * 3 + 0] = bikeX + (Math.random() - 0.5) * 0.7
          pos[idx * 3 + 1] = 0.04 + Math.random() * 0.15
          pos[idx * 3 + 2] = bikeZ - 0.8 + (Math.random() - 0.5) * 0.6

          velocities[idx * 3 + 0] = (Math.random() - 0.5) * 2.4
          velocities[idx * 3 + 1] = 1.2 + Math.random() * 2.6
          velocities[idx * 3 + 2] = -1.5 - Math.random() * 2.5

          life[idx] = 0.0
          maxLife[idx] = 0.25 + Math.random() * 0.35
        }
      }

      for (let i = 0; i < sparksCount; i++) {
        if (life[i] < maxLife[i]) {
          life[i] += dt
          const i3 = i * 3
          pos[i3 + 0] += velocities[i3 + 0] * dt
          pos[i3 + 1] += velocities[i3 + 1] * dt
          pos[i3 + 2] += velocities[i3 + 2] * dt
          velocities[i3 + 1] -= 9.8 * dt * 0.45

          if (pos[i3 + 1] < 0.01) {
            pos[i3 + 1] = 0.01
            velocities[i3 + 1] *= -0.35
          }

          if (life[i] >= maxLife[i]) {
            pos[i3 + 1] = -999
          }
        }
      }
      posAttr.needsUpdate = true
    }

    // C. Gentle Smoke Drift
    if (smokeGroupRef.current && enableSmoke) {
      const smokeChildren = smokeGroupRef.current.children
      for (let i = 0; i < smokeChildren.length; i++) {
        const sprite = smokeChildren[i]
        sprite.rotation.z += 0.06 * dt * (i % 2 === 0 ? 1 : -1)
        sprite.position.y += 0.12 * dt
        if (sprite.position.y > 2.6) {
          sprite.position.y = 0.2
        }
        sprite.material.opacity = Math.min(0.1, 0.02 + intensity * 0.06)
      }
    }
  })

  // Cleanup geometries, materials & textures on unmount
  useEffect(() => {
    const embersEl = embersPointsRef.current
    const sparksEl = sparksPointsRef.current
    return () => {
      glowTexture.dispose()
      smokeTexture.dispose()
      if (embersEl) {
        embersEl.geometry?.dispose()
        embersEl.material?.dispose()
      }
      if (sparksEl) {
        sparksEl.geometry?.dispose()
        sparksEl.material?.dispose()
      }
    }
  }, [glowTexture, smokeTexture])

  return (
    <group>
      {/* 1. Embers Points */}
      <points ref={embersPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[embersData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[embersData.baseColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.14}
          map={glowTexture}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          opacity={0.85}
        />
      </points>

      {/* 2. Fast Sparks Points */}
      <points ref={sparksPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[sparksPool.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.18}
          color={new THREE.Color('#ff5500').multiplyScalar(2.0)}
          map={glowTexture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          opacity={0.95}
        />
      </points>

      {/* 3. Soft Atmospheric Smoke Sprites */}
      {enableSmoke && (
        <group ref={smokeGroupRef}>
          {[-2.2, 0, 2.2].map((xOffset, i) => (
            <sprite
              key={i}
              position={[xOffset, 0.4 + i * 0.4, -1.2]}
              scale={[4.5, 4.5, 1]}
            >
              <spriteMaterial
                map={smokeTexture}
                transparent
                depthWrite={false}
                opacity={0.05}
                blending={THREE.NormalBlending}
              />
            </sprite>
          ))}
        </group>
      )}
    </group>
  )
}
