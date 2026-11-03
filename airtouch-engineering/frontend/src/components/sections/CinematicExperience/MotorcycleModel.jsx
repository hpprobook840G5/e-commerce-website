import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { CINEMATIC_CONFIG } from './cinematicConfig.js'

/**
 * Photoreal 3D Motorcycle Model Component
 * - Loads /models/motorcycle.glb with local Draco decoders
 * - Traverses once to assign cached MeshPhysicalMaterial (clearcoat carpaint, glossy dark visor)
 *   and tuned PBR materials (chrome, billet aluminum, matte rubber tires, emissive optics)
 * - Enforces SRGBColorSpace on color textures, LinearSRGBColorSpace on data maps, and max anisotropy
 * - Smooths transforms and lighting in useFrame via frame-rate-independent THREE.MathUtils.damp
 */
export default function MotorcycleModel({ cinematicStateRef, onModelReady }) {
  const groupRef = useRef(null)
  const headlightLightRef = useRef(null)
  const headlightBulbRef = useRef(null)
  const spotTargetRef = useRef(null)
  const headlightMatRef = useRef(null)

  const gl = useThree((state) => state.gl)

  // Load GLB asset with local Draco decoder support
  const { scene } = useGLTF(CINEMATIC_CONFIG.modelPath, CINEMATIC_CONFIG.dracoPath)

  // Prepare normalized model and cached PBR material library once
  const { model, createdMaterials } = useMemo(() => {
    const clone = scene.clone(true)
    const maxAnisotropy = gl?.capabilities?.getMaxAnisotropy?.() || 8

    // Orient along Z axis (+Z front facing forward, -Z rear)
    clone.rotation.y = Math.PI / 2
    clone.updateMatrixWorld(true)

    // Compute bounding box for automated normalization
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    // Normalize motorcycle height to 1.35 world units
    const targetHeight = 1.35
    const scale = targetHeight / (size.y || 1)
    clone.scale.setScalar(scale)
    clone.updateMatrixWorld(true)

    // Recompute after scaling to center X & Z and place tires flush on y = 0
    box.setFromObject(clone)
    clone.position.x = -center.x * scale
    clone.position.y = -box.min.y
    clone.position.z = -center.z * scale

    // Shared cached material dictionary (created once, never cloned per frame)
    const mats = {
      carpaintPrimary: new THREE.MeshPhysicalMaterial({
        name: 'AirTouch_Carpaint_Charcoal',
        color: new THREE.Color('#141417'),
        metalness: 0.82,
        roughness: 0.28,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.25,
      }),
      carpaintSecondary: new THREE.MeshPhysicalMaterial({
        name: 'AirTouch_Carpaint_Obsidian',
        color: new THREE.Color('#0c0c0f'),
        metalness: 0.8,
        roughness: 0.3,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.2,
      }),
      orangeAccent: new THREE.MeshPhysicalMaterial({
        name: 'AirTouch_Orange_Accent',
        color: new THREE.Color('#f97316'),
        metalness: 0.72,
        roughness: 0.22,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.25,
      }),
      chrome: new THREE.MeshStandardMaterial({
        name: 'AirTouch_Chrome',
        color: new THREE.Color('#f4f4f5'),
        metalness: 1.0,
        roughness: 0.1,
        envMapIntensity: 1.45,
      }),
      brakeDisc: new THREE.MeshStandardMaterial({
        name: 'AirTouch_BrakeDisc_Steel',
        color: new THREE.Color('#d4d4d8'),
        metalness: 1.0,
        roughness: 0.16,
        envMapIntensity: 1.35,
      }),
      engineMetal: new THREE.MeshStandardMaterial({
        name: 'AirTouch_Engine_Billet',
        color: new THREE.Color('#71717a'),
        metalness: 1.0,
        roughness: 0.18,
        envMapIntensity: 1.3,
      }),
      darkChassis: new THREE.MeshPhysicalMaterial({
        name: 'AirTouch_Chassis_Satin',
        color: new THREE.Color('#1c1c21'),
        metalness: 0.78,
        roughness: 0.32,
        clearcoat: 0.45,
        clearcoatRoughness: 0.14,
        envMapIntensity: 1.15,
      }),
      wheelRim: new THREE.MeshPhysicalMaterial({
        name: 'AirTouch_Wheel_Alloy',
        color: new THREE.Color('#18181b'),
        metalness: 0.88,
        roughness: 0.22,
        clearcoat: 0.85,
        clearcoatRoughness: 0.07,
        envMapIntensity: 1.25,
      }),
      anodizedGold: new THREE.MeshStandardMaterial({
        name: 'AirTouch_Fork_Gold',
        color: new THREE.Color('#eab308'),
        metalness: 1.0,
        roughness: 0.14,
        envMapIntensity: 1.35,
      }),
      titaniumExhaust: new THREE.MeshStandardMaterial({
        name: 'AirTouch_Titanium_Bronze',
        color: new THREE.Color('#b45309'),
        metalness: 1.0,
        roughness: 0.17,
        envMapIntensity: 1.3,
      }),
      tireRubber: new THREE.MeshStandardMaterial({
        name: 'AirTouch_Tire_Rubber',
        color: new THREE.Color('#111113'),
        metalness: 0.04,
        roughness: 0.9,
        envMapIntensity: 0.35,
      }),
      visorGlass: new THREE.MeshPhysicalMaterial({
        name: 'AirTouch_Visor_GlossyDark',
        color: new THREE.Color('#09090b'),
        metalness: 0.1,
        roughness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        reflectivity: 1.0,
        envMapIntensity: 1.5,
      }),
      headlightLens: new THREE.MeshStandardMaterial({
        name: 'AirTouch_Headlight_Emissive',
        color: new THREE.Color('#fffbeb'),
        emissive: new THREE.Color('#ffedd5'),
        emissiveIntensity: 2.2,
        metalness: 0.1,
        roughness: 0.08,
      }),
      taillightLens: new THREE.MeshStandardMaterial({
        name: 'AirTouch_Taillight_Emissive',
        color: new THREE.Color('#ef4444'),
        emissive: new THREE.Color('#ef4444'),
        emissiveIntensity: 2.5,
        metalness: 0.1,
        roughness: 0.1,
      }),
      amberSignal: new THREE.MeshStandardMaterial({
        name: 'AirTouch_Amber_Signal',
        color: new THREE.Color('#f97316'),
        emissive: new THREE.Color('#f97316'),
        emissiveIntensity: 1.35,
        metalness: 0.1,
        roughness: 0.12,
      }),
    }

    headlightMatRef.current = mats.headlightLens

    const configureTextures = (material) => {
      if (!material) return
      const srgbSlots = ['map', 'emissiveMap']
      const linearSlots = ['normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'bumpMap']

      srgbSlots.forEach((slot) => {
        if (material[slot]) {
          material[slot].colorSpace = THREE.SRGBColorSpace
          material[slot].anisotropy = maxAnisotropy
          material[slot].needsUpdate = true
        }
      })
      linearSlots.forEach((slot) => {
        if (material[slot]) {
          material[slot].colorSpace = THREE.LinearSRGBColorSpace
          material[slot].anisotropy = maxAnisotropy
          material[slot].needsUpdate = true
        }
      })
    }

    // Single pass over the 129 meshes to assign cached materials & smooth normals
    clone.traverse((child) => {
      if (!child.isMesh) return

      const meshName = (child.name || '').toLowerCase()
      const matName = (child.material?.name || '').toLowerCase()

      // Cast shadows only from primary exterior silhouette meshes (skips microscopic bolts/decals)
      const isMicroDetail =
        meshName.startsWith('bolt') ||
        meshName.startsWith('decal') ||
        meshName.startsWith('dacal') ||
        meshName.startsWith('text_') ||
        meshName.startsWith('button_') ||
        meshName.startsWith('det_') ||
        meshName.startsWith('logo_')

      child.castShadow = !isMicroDetail
      child.receiveShadow = !isMicroDetail

      // Ensure smooth vertex normals if missing
      if (child.geometry && !child.geometry.attributes.normal) {
        child.geometry.computeVertexNormals()
      }

      configureTextures(child.material)

      if (
        meshName.includes('tire') ||
        matName.includes('tire') ||
        meshName.includes('rubber') ||
        meshName.includes('seat') ||
        meshName.includes('hose_black')
      ) {
        child.material = mats.tireRubber
      } else if (
        meshName.includes('lightbulb_hl') ||
        meshName.includes('glass_hl') ||
        meshName.includes('glass_ribs_front') ||
        meshName.includes('glass_small_front') ||
        meshName.includes('led_')
      ) {
        child.material = mats.headlightLens
      } else if (
        matName.includes('redglass') ||
        meshName.includes('glass_rear') ||
        meshName.includes('ribs_glass_rear')
      ) {
        child.material = mats.taillightLens
      } else if (matName.includes('orangeglass')) {
        child.material = mats.amberSignal
      } else if (matName.includes('clearglass')) {
        child.material = mats.visorGlass
      } else if (matName.includes('carpaint_second')) {
        child.material = mats.carpaintSecondary
      } else if (matName.includes('carpaint') || meshName.includes('body_02')) {
        child.material = mats.carpaintPrimary
      } else if (
        matName.includes('red.001') ||
        matName.includes('blue.001') ||
        meshName.includes('decal_rim') ||
        meshName.includes('spring_red')
      ) {
        child.material = mats.orangeAccent
      } else if (matName.includes('chrome') || matName.includes('mirror')) {
        child.material = mats.chrome
      } else if (matName.includes('brakedisk')) {
        child.material = mats.brakeDisc
      } else if (matName.includes('gold')) {
        child.material = mats.anodizedGold
      } else if (matName.includes('bronze')) {
        child.material = mats.titaniumExhaust
      } else if (matName.includes('rim_second')) {
        child.material = mats.wheelRim
      } else if (matName.includes('mattemetal') || matName.includes('gray')) {
        child.material = mats.engineMetal
      } else {
        child.material = mats.darkChassis
      }
    })

    return { model: clone, createdMaterials: Object.values(mats) }
  }, [scene, gl])

  // Bind spotlight target & notify parent that model is ready for shader pre-compile
  useEffect(() => {
    if (headlightLightRef.current && spotTargetRef.current) {
      headlightLightRef.current.target = spotTargetRef.current
    }
    if (onModelReady) {
      onModelReady()
    }
  }, [onModelReady])

  // Dispose created materials on unmount
  useEffect(() => {
    return () => {
      createdMaterials.forEach((m) => m.dispose())
    }
  }, [createdMaterials])

  // Frame-rate-independent damping via THREE.MathUtils.damp (zero allocations)
  useFrame((state, rawDelta) => {
    if (!groupRef.current || !cinematicStateRef.current) return

    const dt = Math.min(rawDelta, 0.05)
    const s = cinematicStateRef.current
    const lambda = 6.5

    // Damp motorcycle world position
    const pos = groupRef.current.position
    pos.x = THREE.MathUtils.damp(pos.x, s.bikeX ?? 0, lambda, dt)
    pos.y = THREE.MathUtils.damp(pos.y, s.bikeY ?? 0, lambda, dt)
    pos.z = THREE.MathUtils.damp(pos.z, s.bikeZ ?? -14, lambda, dt)

    // Damp motorcycle rotation
    const rot = groupRef.current.rotation
    rot.x = THREE.MathUtils.damp(rot.x, s.bikeRotX ?? 0, lambda, dt)
    rot.y = THREE.MathUtils.damp(rot.y, s.bikeRotY ?? 0, lambda, dt)
    rot.z = THREE.MathUtils.damp(rot.z, s.bikeRotZ ?? 0, lambda, dt)

    // Damp headlight spotlight, bulb pointLight, and lens emissive intensity
    const targetHl = s.headlightIntensity ?? 2.2
    if (headlightLightRef.current) {
      headlightLightRef.current.intensity = THREE.MathUtils.damp(
        headlightLightRef.current.intensity,
        targetHl,
        lambda,
        dt
      )
    }
    if (headlightBulbRef.current) {
      headlightBulbRef.current.intensity = THREE.MathUtils.damp(
        headlightBulbRef.current.intensity,
        targetHl * 0.45,
        lambda,
        dt
      )
    }
    if (headlightMatRef.current) {
      headlightMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        headlightMatRef.current.emissiveIntensity,
        1.4 + targetHl * 0.25,
        lambda,
        dt
      )
    }
  })

  return (
    <group ref={groupRef}>
      {/* 3D Motorcycle Mesh Hierarchy */}
      <primitive object={model} />

      {/* Front Headlight Projector Assembly */}
      <group position={[0, 0.9, 0.95]}>
        <pointLight
          ref={headlightBulbRef}
          color="#fffbeb"
          intensity={1.0}
          distance={2.2}
        />

        <spotLight
          ref={headlightLightRef}
          color="#ffedd5"
          intensity={2.2}
          distance={32}
          angle={0.48}
          penumbra={0.68}
        />

        <object3D ref={spotTargetRef} position={[0, -0.6, 10]} />
      </group>

      {/* Rear Taillight Point Glow */}
      <group position={[0, 0.88, -0.98]}>
        <pointLight color="#ef4444" intensity={2.0} distance={2.8} />
      </group>

      {/* Baked Contact Shadow attached to the motorcycle root (frames={1} = zero per-frame cost) */}
      <ContactShadows
        position={[0, 0.002, 0]}
        frames={1}
        opacity={0.72}
        scale={3.4}
        blur={2.4}
        far={1.5}
        resolution={256}
        color="#000000"
      />
    </group>
  )
}

// Preload model asset with local Draco decoders immediately
useGLTF.preload(CINEMATIC_CONFIG.modelPath, CINEMATIC_CONFIG.dracoPath)
