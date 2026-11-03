import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 850,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three/examples') || id.includes('@react-three/drei')) {
              return 'three-drei'
            }
            if (
              id.includes('@react-three/postprocessing') ||
              id.includes('node_modules/postprocessing')
            ) {
              return 'three-postprocessing'
            }
            if (id.includes('@react-three/fiber') || id.includes('react-reconciler')) {
              return 'r3f-core'
            }
            if (id.includes('node_modules/three')) {
              return 'three-core'
            }
            if (id.includes('gsap') || id.includes('lenis') || id.includes('framer-motion')) {
              return 'animation-vendor'
            }
          }
        },
      },
    },
  },
})
