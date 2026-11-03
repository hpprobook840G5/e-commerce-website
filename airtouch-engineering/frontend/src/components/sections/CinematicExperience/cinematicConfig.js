/**
 * AirTouch Engineering - Cinematic Scroll Experience Configuration
 * Single source of truth for assets, 3D settings, Catmull-Rom spline control points,
 * timeline ranges, and storyboard copy.
 */
export const CINEMATIC_CONFIG = {
  // Local Asset Paths (Zero external CDN dependency)
  modelPath: '/models/motorcycle.glb',
  dracoPath: '/draco/',
  hdrPath: '/hdr/night_studio_1k.hdr',
  posterPath: '/cinematic/poster.webp',

  // Device & Tier Configuration
  tiers: {
    desktop: {
      minWidth: 1024,
      pinLength: '+=500%',
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
      pinLength: '+=400%',
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
      pinLength: '+=300%',
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

  // Continuous Catmull-Rom Spline Control Points (sampled 0.0 -> 1.0)
  // 7 control knots corresponding to progress [0.00, 0.17, 0.33, 0.50, 0.67, 0.83, 1.00]
  curves: {
    desktop: {
      cameraPosition: [
        [0.0, 0.62, 3.6],     // 0.00 - Scene 1: Low highway angle looking into the night
        [0.48, 0.74, 3.15],   // 0.17 - Scene 1/2 transition: Approaching bike
        [1.12, 0.82, 2.65],   // 0.33 - Scene 2: Close, heroic 3/4 front-right reveal
        [-1.72, 0.92, 2.55],  // 0.50 - Scene 3: Sweeping showcase orbit around tank/engine
        [0.28, 0.86, 3.22],   // 0.67 - Scene 4: Framed for right-side profile + left copy
        [0.15, 1.05, 3.65],   // 0.83 - Scene 5: Framed with bike on right + center CTA
        [0.0, 1.55, 4.6],     // 1.00 - Scene 5 exit: Elevated highway pullback
      ],
      cameraLookAt: [
        [0.0, 0.68, -4.5],    // 0.00 - Looking down the dark road toward approaching headlight
        [0.0, 0.68, -1.0],    // 0.17 - Tracking approaching bike
        [0.0, 0.66, -0.1],    // 0.33 - Focused on front cowl, gold fork & brake rotor
        [-0.22, 0.66, 0.0],   // 0.50 - Offset lookAt so bike sits right of left text panel
        [0.62, 0.66, 0.15],   // 0.67 - Tracking right-shifted profile stance
        [0.35, 0.64, 0.35],   // 0.83 - Balanced for final CTA card + motorcycle silhouette
        [0.0, 0.58, 1.2],     // 1.00 - Following departure down the road
      ],
      bikePosition: [
        [0.0, 0.0, -5.2],     // 0.00 - Distant highway emergence
        [0.0, 0.0, -1.1],     // 0.17 - Entering midground
        [0.02, 0.0, -0.12],   // 0.33 - Hero close-up reveal stage
        [0.28, 0.0, 0.05],    // 0.50 - Center-right showcase stage
        [1.35, 0.0, 0.25],    // 0.67 - Shifted right to clear left copy space
        [1.05, 0.0, 0.55],    // 0.83 - Holding right-side presence during CTA
        [0.0, 0.0, 3.8],      // 1.00 - Accelerating forward into highway distance
      ],
    },
    mobile: {
      cameraPosition: [
        [0.0, 0.72, 4.0],
        [0.32, 0.82, 3.6],
        [0.78, 0.92, 3.25],
        [-1.18, 1.02, 3.15],
        [0.16, 0.95, 3.55],
        [0.0, 1.18, 4.1],
        [0.0, 1.65, 5.0],
      ],
      cameraLookAt: [
        [0.0, 0.7, -4.2],
        [0.0, 0.65, -1.0],
        [0.0, 0.55, 0.0],
        [0.0, 0.5, 0.0],
        [0.08, 0.5, 0.1],
        [0.0, 0.52, 0.3],
        [0.0, 0.48, 1.0],
      ],
      bikePosition: [
        [0.0, 0.0, -4.8],
        [0.0, 0.0, -1.0],
        [0.0, 0.0, -0.1],
        [0.05, 0.0, 0.0],
        [0.2, 0.0, 0.15],
        [0.15, 0.0, 0.45],
        [0.0, 0.0, 3.2],
      ],
    },
  },

  // Master Timeline Normalized Scene Ranges (0.0 to 1.0)
  sceneRanges: {
    roadIntro: { start: 0.0, end: 0.15, label: 'Road Intro' },
    motorcycleReveal: { start: 0.15, end: 0.4, label: 'Motorcycle Reveal' },
    productShowcase: { start: 0.4, end: 0.6, label: 'Engineered for Performance' },
    brandIntro: { start: 0.6, end: 0.8, label: 'Who We Are' },
    productTransition: { start: 0.8, end: 1.0, label: 'Product Transition' },
  },

  // Color Palette & Visual Accents
  colors: {
    backgroundDark: '#09090b', // Tailwind zinc-950
    primaryOrange: '#f97316',
    emberAmber: '#fbbf24',
    sparkFiery: '#ff4400',
    deepRed: '#dc2626',
    smokeGray: '#27272a',
  },

  // Storyboard Content (Preserved verbatim + legacy aliases for reduced-motion)
  storyboard: {
    roadIntro: {
      eyebrow: 'BUILT FOR THE ROAD',
    },
    productShowcase: {
      heading: 'ENGINEERED FOR PERFORMANCE',
      headline: 'Driven by engineering. Defined by performance.',
      description:
        'AirTouch Engineering is built around the passion for motorcycles, quality components, and the engineering that keeps every ride moving.',
    },
    brandIntro: {
      heading: 'WHO WE ARE',
      headline: 'Everything your machine needs to perform.',
      description:
        'Explore motorcycle spare parts, performance components, and accessories selected for quality, reliability, and the road ahead.',
    },
    productTransition: {
      tagline: 'POWER. PRECISION. PERFORMANCE.',
      ctaText: 'Shop Parts',
      ctaPath: '/products',
    },
    whoWeAre: {
      heading: 'ENGINEERED FOR PERFORMANCE',
      headline: 'Driven by engineering. Defined by performance.',
      description:
        'AirTouch Engineering is built around the passion for motorcycles, quality components, and the engineering that keeps every ride moving.',
    },
    whatWeSell: {
      heading: 'WHO WE ARE',
      headline: 'Everything your machine needs to perform.',
      description:
        'Explore motorcycle spare parts, performance components, and accessories selected for quality, reliability, and the road ahead.',
    },
    exit: {
      tagline: 'POWER. PRECISION. PERFORMANCE.',
      ctaText: 'Shop Parts',
      ctaPath: '/products',
    },
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
