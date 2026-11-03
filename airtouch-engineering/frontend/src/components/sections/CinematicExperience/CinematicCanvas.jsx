import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Environment,
  Lightformer,
  ContactShadows,
  PerformanceMonitor,
  Preload,
} from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  ChromaticAberration,
  SMAA,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import MotorcycleModel from './MotorcycleModel.jsx'
import RoadEnvironment from './RoadEnvironment.jsx'
import CameraRig from './CameraRig.jsx'
import ParticleEffects from './ParticleEffects.jsx'
import { CINEMATIC_CONFIG } from './cinematicConfig.js'

// Pre-allocated chromatic aberration offset vector (zero per-frame allocation)
const CHROMATIC_OFFSET = new THREE.Vector2(0.0005, 0.0005)

function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

/**
 * Damps the orange rim directional light intensity & pre-compiles shaders once loaded
 */
function SceneController({ cinematicStateRef, modelReady, onCompiled }) {
  const rimLightRef = useRef(null)
  const compiledRef = useRef(false)
  const { gl, scene, camera } = useThree()

  useEffect(() => {
    if (modelReady && !compiledRef.current) {
      compiledRef.current = true
      try {
        gl.compile(scene, camera)
      } catch {
        // Ignore non-fatal shader pre-compile warnings
      }
      if (onCompiled) onCompiled()
    }
  }, [modelReady, gl, scene, camera, onCompiled])

  useFrame((state, rawDelta) => {
    if (!rimLightRef.current || !cinematicStateRef.current) return
    const dt = Math.min(rawDelta, 0.05)
    const targetRim = cinematicStateRef.current.rimIntensity ?? 3.2
    rimLightRef.current.intensity = THREE.MathUtils.damp(
      rimLightRef.current.intensity,
      targetRim,
      6,
      dt
    )
  })

  return (
    <directionalLight
      ref={rimLightRef}
      position={[-5, 3.5, -4]}
      intensity={3.2}
      color="#f97316"
    />
  )
}

/**
 * CinematicCanvas Component
 * Complete real-time HD 3D React Three Fiber scene:
 * - ACESFilmicToneMapping, SRGBColorSpace, dpr [1, 2] desktop / [1, 1.5] tablet / 1 mobile
 * - Local HDR Environment (/hdr/night_studio_1k.hdr) + Lightformer studio reflection panels
 * - 2048 PCFSoft key shadow map + ContactShadows under tires
 * - MeshReflectorMaterial wet-asphalt highway
 * - EffectComposer (Bloom, Vignette, subtle Film Grain, desktop ChromaticAberration, MSAA/SMAA)
 * - Ordered adaptive quality via PerformanceMonitor
 */
export default function CinematicCanvas({
  tier,
  cinematicStateRef,
  mouseRef,
  isInViewport = true,
  onSceneReady,
}) {
  const [hasWebGL, setHasWebGL] = useState(true)
  const [modelReady, setModelReady] = useState(false)

  // Adaptive quality state (0 = max quality for tier, 1 = reduced dpr, 2 = no reflector, 3 = no bloom/msaa)
  const [qualityDegradeStep, setQualityDegradeStep] = useState(0)

  useEffect(() => {
    setHasWebGL(checkWebGLSupport())
  }, [])

  // Reset degradation step when tier changes
  useEffect(() => {
    setQualityDegradeStep(0)
  }, [tier.name])

  const handleDecline = useCallback(() => {
    setQualityDegradeStep((prev) => Math.min(3, prev + 1))
  }, [])

  const handleIncline = useCallback(() => {
    setQualityDegradeStep((prev) => Math.max(0, prev - 1))
  }, [])

  const handleModelReady = useCallback(() => {
    setModelReady(true)
  }, [])

  if (!hasWebGL) {
    return (
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <img
          src={CINEMATIC_CONFIG.posterPath}
          alt="AirTouch Motorcycle Atmospheric Still"
          className="w-full h-full object-cover opacity-60"
        />
      </div>
    )
  }

  // Compute active DPR (never drops below 1.0)
  const maxDpr = tier.dprCap || 2.0
  const activeMaxDpr =
    qualityDegradeStep === 0
      ? maxDpr
      : qualityDegradeStep === 1
        ? Math.max(1.0, maxDpr * 0.75)
        : 1.0
  const dpr = tier.name === 'mobile' ? 1 : [1, activeMaxDpr]

  const reflectorEnabled = tier.name !== 'mobile' && qualityDegradeStep < 2
  const composerEnabled =
    tier.name !== 'mobile' && tier.enablePostProcessing && qualityDegradeStep < 3
  const msaaSamples =
    tier.name === 'desktop' && qualityDegradeStep < 2 ? tier.multisampling || 4 : 0

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      aria-hidden="true"
    >
      <Canvas
        shadows
        dpr={dpr}
        frameloop={isInViewport ? 'always' : 'never'}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 0.65, 3.8], fov: 42, near: 0.1, far: 75 }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.12
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
          scene.background = new THREE.Color('#09090b')

          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            setHasWebGL(false)
          })
        }}
      >
        <color attach="background" args={['#09090b']} />
        <fog attach="fog" args={['#09090b', 14, 52]} />

        {/* Adaptive Quality Monitor */}
        <PerformanceMonitor
          onDecline={handleDecline}
          onIncline={handleIncline}
          flipflops={3}
          onFallback={() => setQualityDegradeStep(3)}
        />

        {/* ================= IMAGE-BASED LIGHTING (Local HDR + Lightformers) ================= */}
        <Suspense fallback={null}>
          <Environment
            files={CINEMATIC_CONFIG.hdrPath}
            background={false}
            environmentIntensity={0.85}
          >
            {/* Long overhead studio softbox for crisp tank & fairing highlight streak */}
            <Lightformer
              form="rect"
              intensity={2.8}
              color="#ffffff"
              scale={[10, 1.4, 1]}
              position={[0, 5.2, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            />
            {/* Fiery orange side strip for automotive rim reflection */}
            <Lightformer
              form="rect"
              intensity={4.2}
              color="#f97316"
              scale={[8, 1.8, 1]}
              position={[-5.5, 2.0, -1.5]}
              rotation={[0, Math.PI / 2.4, 0]}
            />
            {/* Cool-white right studio panel for chrome, fork & rotor specularity */}
            <Lightformer
              form="rect"
              intensity={2.4}
              color="#e2e8f0"
              scale={[8, 1.4, 1]}
              position={[5.5, 2.4, 1.2]}
              rotation={[0, -Math.PI / 2.4, 0]}
            />
            {/* Warm amber rear accent */}
            <Lightformer
              form="ring"
              intensity={2.0}
              color="#fbbf24"
              scale={3}
              position={[0, 2.2, -6]}
            />
          </Environment>
        </Suspense>

        {/* ================= ANALYTICAL LIGHTING & 2048 SHADOWS ================= */}
        {/* 1. Key directional light with tight 2048 shadow frustum around motorcycle */}
        <directionalLight
          position={[3.8, 7.2, 3.8]}
          intensity={1.5}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1.0}
          shadow-camera-far={18}
          shadow-camera-left={-2.6}
          shadow-camera-right={2.6}
          shadow-camera-top={2.6}
          shadow-camera-bottom={-2.6}
          shadow-bias={-0.0002}
          shadow-normalBias={0.02}
        />

        {/* 2. Damped Orange Rim Light + Shader Pre-Compiler */}
        <SceneController
          cinematicStateRef={cinematicStateRef}
          modelReady={modelReady}
          onCompiled={onSceneReady}
        />

        {/* 3. Cool-white Back Light for silhouette separation */}
        <directionalLight
          position={[0.5, 4.5, -5.5]}
          intensity={1.35}
          color="#cbd5e1"
        />

        {/* ================= SCENE ELEMENTS ================= */}
        {/* Continuous Catmull-Rom Spline Camera Rig with Damped Parallax */}
        <CameraRig
          cinematicStateRef={cinematicStateRef}
          mouseRef={mouseRef}
          tier={tier}
        />

        {/* Photoreal 3D Motorcycle Model (with attached ContactShadows) */}
        <Suspense fallback={null}>
          <MotorcycleModel
            cinematicStateRef={cinematicStateRef}
            onModelReady={handleModelReady}
          />
        </Suspense>

        {/* Wet-Asphalt Reflective Road Environment */}
        <RoadEnvironment tier={tier} reflectorEnabled={reflectorEnabled} />

        {/* Particle Embers, Sparks, and Smoke */}
        <ParticleEffects
          tier={tier}
          effectsStateRef={cinematicStateRef}
        />

        {/* Preload all assets into GPU memory */}
        <Preload all />

        {/* ================= POST-PROCESSING (Desktop & Tablet Only) ================= */}
        {composerEnabled && (
          <EffectComposer
            multisampling={msaaSamples}
            enableNormalPass={false}
          >
            {msaaSamples === 0 && <SMAA />}
            <Bloom
              luminanceThreshold={0.85}
              mipmapBlur
              intensity={0.6}
              radius={0.65}
            />
            <Vignette eskil={false} offset={0.22} darkness={0.62} />
            <Noise
              premultiply
              blendFunction={BlendFunction.OVERLAY}
              opacity={0.035}
            />
            {tier.name === 'desktop' && (
              <ChromaticAberration
                offset={CHROMATIC_OFFSET}
                radialModulation
                modulationOffset={0.65}
              />
            )}
          </EffectComposer>
        )}
      </Canvas>
    </div>
  )
}
