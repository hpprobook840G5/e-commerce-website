/**
 * AirTouch Engineering - 3D Motorcycle Showcase Configuration
 * Single source of truth for showcase pose constants, Phase 1 approach splines,
 * Phase 2 360° rotation physics, Phase 3 clickable part mesh mappings, and render tiers.
 */

// ================= SHOWCASE POSE CONSTANTS (End of Phase 1 / Phase 2 Base) =================
// Centered on road, full side profile (facing +X with exhaust side toward camera), level on y = 0
export const SHOWCASE_CAMERA_POS = [0, 0.78, 3.25]
export const SHOWCASE_CAMERA_LOOK_AT = [0, 0.62, 0]
export const SHOWCASE_BIKE_POS = [0, 0, 0]
export const SHOWCASE_BIKE_ROTATION = [0, Math.PI / 2, 0]

// ================= PHASE 2 AUTO-ROTATE CONSTANTS =================
// Slow, cinematic auto-rotate: 1 full 360° revolution every 20 seconds (2π / 20 ≈ 0.31416 rad/s)
export const AUTO_ROTATE_SPEED = (Math.PI * 2) / 20.0
// Short delay (1.25s) after pointer leaves the 3D canvas/model before auto-rotate smoothly resumes
export const AUTO_ROTATE_HOVER_RESUME_DELAY_MS = 1250

// ================= PHASE 1 APPROACH START CONSTANTS =================
export const APPROACH_START_CAMERA_POS = [0, 0.62, 3.9]
export const APPROACH_START_LOOK_AT = [0, 0.66, -6.5]
export const APPROACH_START_BIKE_POS = [0, 0, -11.5]
export const APPROACH_START_BIKE_ROTATION = [0, 0, 0]

// ================= PHASE 3 CLICKABLE PARTS (Actual Separable GLB Meshes) =================
// Note: "fuel tank" is NOT a separate mesh in public/models/motorcycle.glb (its outer painted
// side panels are fused into the full-length fairing mesh `body001_carpaint_second.001_0`
// spanning z = -0.99 to +1.02). Per spec, only genuinely separable meshes are mapped here.
export const CLICKABLE_PARTS = [
  {
    id: 'seat',
    name: 'Seat',
    category: 'seat',
    url: '/products?category=seat',
    meshNames: ['seat_black.001_0'],
    // Surface coordinates in normalized motorcycle group space
    localAnchor: [0.0, 0.91, -0.35],
  },
  {
    id: 'headlight',
    name: 'Headlight',
    category: 'headlight',
    url: '/products?category=headlight',
    meshNames: [
      'glass_HL_clearglass.001_0',
      'reflector_HL_chrome.001_0',
      'lightbulb_HL_clearglass.001_0',
      'body_HL_black.001_0',
      'det_reflector_HL_chrome.001_0',
      'plastic_HL_black.001_0',
    ],
    localAnchor: [-0.05, 0.87, 0.65],
  },
  {
    id: 'exhaust',
    name: 'Exhaust',
    category: 'exhaust',
    url: '/products?category=exhaust',
    meshNames: [
      'muffler01_mattemetal.001_0',
      'muffler_01_mattemetal.001_0',
      'muffler02_bronze.001_0',
      'weld_muffler_bronze.001_0',
    ],
    localAnchor: [-0.25, 0.56, -0.56],
  },
  {
    id: 'front-tire',
    name: 'Front Tire',
    category: 'front-tire',
    url: '/products?category=front-tire',
    meshNames: ['tire_front_tire.001_0'],
    localAnchor: [0.0, 0.36, 0.88],
  },
  {
    id: 'rear-tire',
    name: 'Rear Tire',
    category: 'rear-tire',
    url: '/products?category=rear-tire',
    meshNames: ['tire_rear_tire.001_0'],
    localAnchor: [0.0, 0.36, -0.82],
  },
  {
    id: 'handlebars',
    name: 'Handlebars',
    category: 'handlebars',
    url: '/products?category=handlebars',
    meshNames: [
      'handlebar_black.001_0',
      'axis_handle_mattemetal.001_0',
      'bolt_handle_mattemetal.001_0',
      'det_handle_black.001_0',
      'lever_mattemetal.001_0',
      'det_lever_black.001_0',
      'switch_black.001_0',
      'button_gray_gray.001_0',
      'button_red_red.001_0',
    ],
    localAnchor: [-0.28, 1.07, 0.43],
  },
]

export const NON_SEPARABLE_PARTS = [
  {
    id: 'fuel-tank',
    name: 'Fuel Tank',
    reason:
      'Outer tank shrouds are fused with the nose and tail bodywork in mesh body001_carpaint_second.001_0 (zRange [-0.99, 1.02]).',
  },
]

export const CINEMATIC_CONFIG = {
  // Local Asset Paths
  modelPath: '/models/motorcycle.glb',
  dracoPath: '/draco/',
  hdrPath: '/hdr/night_studio_1k.hdr',
  posterPath: '/cinematic/poster.webp',

  // Showcase Pose Constants
  SHOWCASE_CAMERA_POS,
  SHOWCASE_CAMERA_LOOK_AT,
  SHOWCASE_BIKE_POS,
  SHOWCASE_BIKE_ROTATION,
  AUTO_ROTATE_SPEED,
  AUTO_ROTATE_HOVER_RESUME_DELAY_MS,

  // Normalized scroll progress (within pinned section) where Phase 1 completes
  // and hands off to Phase 2 free 360° showcase while remaining pinned until 1.0
  phase1EndProgress: 0.72,

  // Phase 2 Free Rotation & Auto-Rotate Settings
  rotation: {
    dragSensitivityDesktop: 0.0085,
    dragSensitivityTouch: 0.0115,
    dampingLambda: 9.0,
    inertiaDecayLambda: 5.0,
    // ~20 seconds per full 360° revolution (2π / 20 ≈ 0.31416 rad/s)
    autoRotateSpeedRadPerSec: AUTO_ROTATE_SPEED,
    // Wait after Phase 1 ends or after user releases drag before auto-rotating
    autoRotateResumeDelayMs: 2200,
    // Short delay (1.25s) after pointer leaves canvas before auto-rotate smoothly resumes
    hoverResumeDelayMs: AUTO_ROTATE_HOVER_RESUME_DELAY_MS,
    // Continuous damping lambdas for smooth ramp-down on hover-in and ramp-up on hover-out
    hoverPauseRampLambda: 16.0,
    autoRotateRampLambda: 3.5,
    scrollContinueHintDelayMs: 1600,
  },

  // Clickable Parts Registry
  clickableParts: CLICKABLE_PARTS,
  nonSeparableParts: NON_SEPARABLE_PARTS,

  // Device & Tier Configuration (Render quality settings preserved verbatim)
  tiers: {
    desktop: {
      minWidth: 1024,
      pinLength: '+=240%',
      dprCap: 2.0,
      reflectorResolution: 512,
      enableReflector: true,
      enablePostProcessing: true,
      multisampling: 4,
      particles: {
        embers: 450,
        sparks: 90,
        enableSmoke: true,
      },
    },
    tablet: {
      minWidth: 768,
      pinLength: '+=210%',
      dprCap: 1.5,
      reflectorResolution: 256,
      enableReflector: true,
      enablePostProcessing: true,
      multisampling: 0,
      particles: {
        embers: 240,
        sparks: 50,
        enableSmoke: true,
      },
    },
    mobile: {
      minWidth: 0,
      pinLength: '+=190%',
      dprCap: 1.0,
      reflectorResolution: 0,
      enableReflector: false,
      enablePostProcessing: false,
      multisampling: 0,
      particles: {
        embers: 120,
        sparks: 25,
        enableSmoke: false,
      },
    },
  },

  // Phase 1 Approach Continuous Catmull-Rom Spline Control Points (0.0 -> 1.0 of Phase 1)
  // Guaranteed to terminate at exact SHOWCASE_CAMERA_POS, SHOWCASE_CAMERA_LOOK_AT, SHOWCASE_BIKE_POS
  approachCurves: {
    cameraPosition: [
      APPROACH_START_CAMERA_POS, // 0.00 - Low highway angle looking down the road
      [0.32, 0.68, 3.65],        // 0.33 - Subtle cinematic sweep as headlight approaches
      [0.1, 0.74, 3.38],         // 0.67 - Settling into center studio framing
      SHOWCASE_CAMERA_POS,       // 1.00 - Exact Showcase Camera Position [0, 0.78, 3.25]
    ],
    cameraLookAt: [
      APPROACH_START_LOOK_AT,    // 0.00 - Looking down dark road toward approaching bike
      [0.0, 0.65, -2.8],         // 0.33 - Tracking bike through midground
      [0.0, 0.63, -0.5],         // 0.67 - Locking onto center stage
      SHOWCASE_CAMERA_LOOK_AT,   // 1.00 - Exact Showcase LookAt [0, 0.62, 0]
    ],
    bikePosition: [
      APPROACH_START_BIKE_POS,   // 0.00 - Distant highway start [0, 0, -11.5]
      [0.0, 0.0, -5.8],          // 0.33 - Mid-highway approach
      [0.0, 0.0, -1.35],         // 0.67 - Decelerating into center stage turn
      SHOWCASE_BIKE_POS,         // 1.00 - Exact Showcase Bike Position [0, 0, 0]
    ],
  },

  // Color Palette & Visual Accents
  colors: {
    backgroundDark: '#09090b',
    primaryOrange: '#f97316',
    emberAmber: '#fbbf24',
    sparkFiery: '#ff4400',
    deepRed: '#dc2626',
    smokeGray: '#27272a',
  },
}

/**
 * Returns the active tier settings based on current window width
 */
export function getActiveTier(width = typeof window !== 'undefined' ? window.innerWidth : 1200) {
  if (width >= CINEMATIC_CONFIG.tiers.desktop.minWidth) {
    return { name: 'desktop', ...CINEMATIC_CONFIG.tiers.desktop }
  }
  if (width >= CINEMATIC_CONFIG.tiers.tablet.minWidth) {
    return { name: 'tablet', ...CINEMATIC_CONFIG.tiers.tablet }
  }
  return { name: 'mobile', ...CINEMATIC_CONFIG.tiers.mobile }
}
