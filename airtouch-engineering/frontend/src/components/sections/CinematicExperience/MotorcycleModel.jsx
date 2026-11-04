import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import {
  AUTO_ROTATE_SPEED,
  CINEMATIC_CONFIG,
  CLICKABLE_PARTS,
  SHOWCASE_BIKE_POS,
  SHOWCASE_BIKE_ROTATION,
} from './cinematicConfig.js'

// Pre-allocated vectors and raycaster for zero per-frame / per-pointer-move allocations
const _raycaster = new THREE.Raycaster()
const _ndcVec = new THREE.Vector2()
const _projVec = new THREE.Vector3()
const _orangeHighlightColor = new THREE.Color('#ff6a00')

// Three.js GLTFLoader sanitizes node/mesh names by stripping '.' characters (e.g. "seat_black.001_0" -> "seat_black001_0")
const normalizeMeshKey = (name = '') => name.replace(/\./g, '').toLowerCase()

/**
 * Photoreal 3D Motorcycle Model Component
 * - Loads /models/motorcycle.glb with local Draco decoders
 * - Assigns cached MeshPhysicalMaterial & PBR materials once on load
 * - Isolates material instances per clickable part (seat, headlight, exhaust,
 *   front-tire, rear-tire, handlebars) so hover/selection highlights ONLY that part
 * - Drives Phase 1 approach damping & Phase 2 free 360° rotation (drag inertia + slow 20s/rev auto-rotate with hover pause)
 * - Screen-projects floating HTML part label & mobile hotspot dots directly via DOM refs in useFrame
 */
export default function MotorcycleModel({
  cinematicStateRef,
  interactionRef,
  floatingLabelRef,
  mobileDotRefs,
  prefersReducedMotion = false,
  onModelReady,
}) {
  const groupRef = useRef(null)
  const headlightLightRef = useRef(null)
  const headlightBulbRef = useRef(null)
  const spotTargetRef = useRef(null)
  const headlightMatRef = useRef(null)

  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)

  // Load GLB asset with local Draco decoder support
  const { scene } = useGLTF(CINEMATIC_CONFIG.modelPath, CINEMATIC_CONFIG.dracoPath)

  // Prepare normalized model, cached PBR materials, and isolated clickable part registries once
  const {
    model,
    createdMaterials,
    clickableMeshes,
    partMaterialsMap,
    partAnchorsMap,
    partHighlightLevels,
  } = useMemo(() => {
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
    clone.updateMatrixWorld(true)

    // Lookup from normalized mesh name -> clickable part id
    const meshToPartId = new Map()
    CLICKABLE_PARTS.forEach((part) => {
      part.meshNames.forEach((mName) => {
        meshToPartId.set(normalizeMeshKey(mName), part.id)
      })
    })

    // Base cached material dictionary
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

    const allDisposables = Object.values(mats)
    const clickableMeshList = []
    const partMats = {}
    const partAnchors = {}
    const highlightLevels = {}

    CLICKABLE_PARTS.forEach((p) => {
      partMats[p.id] = []
      partAnchors[p.id] = new THREE.Vector3(
        p.localAnchor[0],
        p.localAnchor[1],
        p.localAnchor[2]
      )
      highlightLevels[p.id] = 0
    })

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

    // Single pass over the 129 meshes to assign cached materials & isolate clickable part materials
    clone.traverse((child) => {
      if (!child.isMesh) return

      const exactName = child.name || ''
      const meshName = exactName.toLowerCase()
      const matName = (child.material?.name || '').toLowerCase()

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

      if (child.geometry && !child.geometry.attributes.normal) {
        child.geometry.computeVertexNormals()
      }

      configureTextures(child.material)

      let baseMat = mats.darkChassis
      if (
        meshName.includes('tire') ||
        matName.includes('tire') ||
        meshName.includes('rubber') ||
        meshName.includes('seat') ||
        meshName.includes('hose_black')
      ) {
        baseMat = mats.tireRubber
      } else if (
        meshName.includes('lightbulb_hl') ||
        meshName.includes('glass_hl') ||
        meshName.includes('glass_ribs_front') ||
        meshName.includes('glass_small_front') ||
        meshName.includes('led_')
      ) {
        baseMat = mats.headlightLens
      } else if (
        matName.includes('redglass') ||
        meshName.includes('glass_rear') ||
        meshName.includes('ribs_glass_rear')
      ) {
        baseMat = mats.taillightLens
      } else if (matName.includes('orangeglass')) {
        baseMat = mats.amberSignal
      } else if (matName.includes('clearglass')) {
        baseMat = mats.visorGlass
      } else if (matName.includes('carpaint_second')) {
        baseMat = mats.carpaintSecondary
      } else if (matName.includes('carpaint') || meshName.includes('body_02')) {
        baseMat = mats.carpaintPrimary
      } else if (
        matName.includes('red.001') ||
        matName.includes('blue.001') ||
        meshName.includes('decal_rim') ||
        meshName.includes('spring_red')
      ) {
        baseMat = mats.orangeAccent
      } else if (matName.includes('chrome') || matName.includes('mirror')) {
        baseMat = mats.chrome
      } else if (matName.includes('brakedisk')) {
        baseMat = mats.brakeDisc
      } else if (matName.includes('gold')) {
        baseMat = mats.anodizedGold
      } else if (matName.includes('bronze')) {
        baseMat = mats.titaniumExhaust
      } else if (matName.includes('rim_second')) {
        baseMat = mats.wheelRim
      } else if (matName.includes('mattemetal') || matName.includes('gray')) {
        baseMat = mats.engineMetal
      }

      const partId = meshToPartId.get(normalizeMeshKey(exactName))
      if (partId) {
        // Clone material once for this clickable part so highlighting affects ONLY this part
        const isolatedMat = baseMat.clone()
        allDisposables.push(isolatedMat)
        child.material = isolatedMat
        child.userData.partId = partId

        if (child.geometry) {
          child.geometry.computeBoundingBox()
          child.geometry.computeBoundingSphere()
        }

        partMats[partId].push({
          mat: isolatedMat,
          baseEmissive: isolatedMat.emissive.clone(),
          baseEmissiveIntensity: isolatedMat.emissiveIntensity || 0,
        })

        clickableMeshList.push(child)
      } else {
        child.material = baseMat
      }
    })

    return {
      model: clone,
      createdMaterials: allDisposables,
      clickableMeshes: clickableMeshList,
      partMaterialsMap: partMats,
      partAnchorsMap: partAnchors,
      partHighlightLevels: highlightLevels,
    }
  }, [scene, gl])

  // Expose imperative zero-allocation raycaster & part projection helper on interactionRef
  useEffect(() => {
    if (!interactionRef) return
    interactionRef.current = {
      raycastClientXY: (clientX, clientY) => {
        if (!gl?.domElement || !camera || clickableMeshes.length === 0) return null
        const rect = gl.domElement.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) return null

        _ndcVec.x = ((clientX - rect.left) / rect.width) * 2 - 1
        _ndcVec.y = -((clientY - rect.top) / rect.height) * 2 + 1

        _raycaster.setFromCamera(_ndcVec, camera)
        const hits = _raycaster.intersectObjects(clickableMeshes, false)
        if (hits.length > 0) {
          return hits[0].object?.userData?.partId || null
        }
        return null
      },
      getPartClientXY: (partId) => {
        const grp = groupRef.current
        const anchor = partAnchorsMap[partId]
        if (!grp || !anchor || !gl?.domElement || !camera) return null
        grp.updateMatrixWorld()
        const rect = gl.domElement.getBoundingClientRect()
        _projVec.copy(anchor).applyMatrix4(grp.matrixWorld).project(camera)
        return {
          clientX: rect.left + (_projVec.x * 0.5 + 0.5) * rect.width,
          clientY: rect.top + (-_projVec.y * 0.5 + 0.5) * rect.height,
        }
      },
      getHighlightLevels: () => ({ ...partHighlightLevels }),
    }
  }, [interactionRef, gl, camera, clickableMeshes, partAnchorsMap, partHighlightLevels])

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

  // Frame-rate-independent damping, 360° rotation, part highlights & screen projection (zero allocations)
  useFrame((state, rawDelta) => {
    const grp = groupRef.current
    const s = cinematicStateRef?.current
    if (!grp || !s) return

    const dt = Math.min(rawDelta, 0.05)
    const {
      dampingLambda,
      inertiaDecayLambda,
      autoRotateResumeDelayMs,
      hoverResumeDelayMs,
      hoverPauseRampLambda,
      autoRotateRampLambda,
    } = CINEMATIC_CONFIG.rotation

    // 1. World Position Damping
    const targetX = s.bikeX ?? SHOWCASE_BIKE_POS[0]
    const targetY = s.bikeY ?? SHOWCASE_BIKE_POS[1]
    const targetZ = s.bikeZ ?? SHOWCASE_BIKE_POS[2]

    if (prefersReducedMotion) {
      grp.position.set(targetX, targetY, targetZ)
    } else {
      grp.position.x = THREE.MathUtils.damp(grp.position.x, targetX, 8.5, dt)
      grp.position.y = THREE.MathUtils.damp(grp.position.y, targetY, 8.5, dt)
      grp.position.z = THREE.MathUtils.damp(grp.position.z, targetZ, 8.5, dt)
    }

    // 2. Phase 1 vs Phase 2 Rotation Logic
    if (s.phase === 'showcase') {
      if (prefersReducedMotion) {
        // Static showcase pose; drag still works directly without inertia or auto-rotate
        s.dragVelocity = 0
        s.autoRotateSpeed = 0
        s.currentRotY = s.targetRotY
      } else {
        if (!s.isDragging) {
          // Exponential decay of release drag momentum
          if (Math.abs(s.dragVelocity) > 0.0005) {
            s.targetRotY += s.dragVelocity * dt
            s.dragVelocity = THREE.MathUtils.damp(
              s.dragVelocity,
              0,
              inertiaDecayLambda,
              dt
            )
          } else {
            s.dragVelocity = 0
          }

          // Slow cinematic auto-rotate (~20s/revolution):
          // Pauses immediately when pointer hovers over the canvas/model (desktop/mouse),
          // and resumes after hoverResumeDelayMs (1.25s) once pointer leaves
          const now = performance.now()
          const idleMs = now - (s.lastInteractionAt || 0)
          const hoverLeaveMs =
            s.lastHoverLeaveAt > 0 ? now - s.lastHoverLeaveAt : Infinity
          const isPausedByHover =
            Boolean(s.isPointerHovering) || hoverLeaveMs < hoverResumeDelayMs
          const canAutoRotate =
            idleMs >= autoRotateResumeDelayMs && !isPausedByHover
          const targetAutoSpeed = canAutoRotate ? AUTO_ROTATE_SPEED : 0
          const rampLambda = isPausedByHover
            ? hoverPauseRampLambda
            : autoRotateRampLambda

          s.autoRotateSpeed = THREE.MathUtils.damp(
            s.autoRotateSpeed || 0,
            targetAutoSpeed,
            rampLambda,
            dt
          )

          const autoDelta = s.autoRotateSpeed * dt
          s.targetRotY += autoDelta
          s.currentRotY += autoDelta
        } else {
          s.autoRotateSpeed = 0
        }

        s.currentRotY = THREE.MathUtils.damp(
          s.currentRotY,
          s.targetRotY,
          dampingLambda,
          dt
        )
      }

      s.bikeRotY = s.currentRotY
      grp.rotation.x = THREE.MathUtils.damp(
        grp.rotation.x,
        SHOWCASE_BIKE_ROTATION[0],
        8.5,
        dt
      )
      grp.rotation.y = s.currentRotY
      grp.rotation.z = THREE.MathUtils.damp(
        grp.rotation.z,
        SHOWCASE_BIKE_ROTATION[2],
        8.5,
        dt
      )
    } else {
      // Phase 1 Approach: Smoothly damp toward ScrollTrigger timeline rotation
      s.currentRotY = THREE.MathUtils.damp(
        s.currentRotY,
        s.bikeRotY ?? 0,
        8.5,
        dt
      )
      s.targetRotY = s.currentRotY
      grp.rotation.x = THREE.MathUtils.damp(grp.rotation.x, s.bikeRotX ?? 0, 8.5, dt)
      grp.rotation.y = s.currentRotY
      grp.rotation.z = THREE.MathUtils.damp(grp.rotation.z, s.bikeRotZ ?? 0, 8.5, dt)
    }

    // 3. Headlight intensity damping
    const targetHl = s.headlightIntensity ?? 4.8
    if (headlightLightRef.current) {
      headlightLightRef.current.intensity = THREE.MathUtils.damp(
        headlightLightRef.current.intensity,
        targetHl,
        6.5,
        dt
      )
    }
    if (headlightBulbRef.current) {
      headlightBulbRef.current.intensity = THREE.MathUtils.damp(
        headlightBulbRef.current.intensity,
        targetHl * 0.45,
        6.5,
        dt
      )
    }
    if (headlightMatRef.current) {
      headlightMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        headlightMatRef.current.emissiveIntensity,
        1.4 + targetHl * 0.25,
        6.5,
        dt
      )
    }

    // 4. Per-part hover / selection emissive glow (only highlights active part)
    const activeHoverId = s.phase === 'showcase' ? s.hoveredPartId : null
    const activeSelectedId = s.phase === 'showcase' ? s.selectedPartId : null

    for (let i = 0; i < CLICKABLE_PARTS.length; i++) {
      const partId = CLICKABLE_PARTS[i].id
      const isHighlighted = partId === activeHoverId || partId === activeSelectedId
      const targetLevel = isHighlighted ? 1.0 : 0.0
      const prevLevel = partHighlightLevels[partId]

      if (Math.abs(prevLevel - targetLevel) > 0.001 || targetLevel > 0) {
        const nextLevel = prefersReducedMotion
          ? targetLevel
          : THREE.MathUtils.damp(prevLevel, targetLevel, 12.0, dt)
        partHighlightLevels[partId] = nextLevel

        const matEntries = partMaterialsMap[partId]
        for (let m = 0; m < matEntries.length; m++) {
          const entry = matEntries[m]
          entry.mat.emissive.lerpColors(
            entry.baseEmissive,
            _orangeHighlightColor,
            nextLevel
          )
          entry.mat.emissiveIntensity = THREE.MathUtils.lerp(
            entry.baseEmissiveIntensity,
            2.1,
            nextLevel
          )
        }
      }
    }

    // 5. Screen-project 3D part anchors to 2D viewport coordinates for floating label & mobile dots
    if (s.phase === 'showcase') {
      grp.updateMatrixWorld()
      const vw = state.size.width
      const vh = state.size.height

      // Update floating "Buy [Part Name] ->" label position if a part is selected
      if (activeSelectedId && floatingLabelRef?.current) {
        const anchor = partAnchorsMap[activeSelectedId]
        if (anchor) {
          _projVec.copy(anchor).applyMatrix4(grp.matrixWorld).project(state.camera)
          const rawX = (_projVec.x * 0.5 + 0.5) * vw
          const rawY = (-_projVec.y * 0.5 + 0.5) * vh
          // Clamp inside viewport so label never overflows horizontally even at 375px
          const clampedX = Math.max(92, Math.min(vw - 92, rawX))
          const clampedY = Math.max(64, Math.min(vh - 56, rawY))
          floatingLabelRef.current.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0) translate(-50%, -125%)`
        }
      }

      // Update mobile hotspot pulsing dots positions
      if (mobileDotRefs?.current) {
        for (let i = 0; i < CLICKABLE_PARTS.length; i++) {
          const partId = CLICKABLE_PARTS[i].id
          const dotEl = mobileDotRefs.current[partId]
          const anchor = partAnchorsMap[partId]
          if (dotEl && anchor) {
            _projVec.copy(anchor).applyMatrix4(grp.matrixWorld).project(state.camera)
            const rawX = (_projVec.x * 0.5 + 0.5) * vw
            const rawY = (-_projVec.y * 0.5 + 0.5) * vh
            const clampedX = Math.max(20, Math.min(vw - 20, rawX))
            const clampedY = Math.max(20, Math.min(vh - 20, rawY))
            dotEl.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0) translate(-50%, -50%)`
          }
        }
      }
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
