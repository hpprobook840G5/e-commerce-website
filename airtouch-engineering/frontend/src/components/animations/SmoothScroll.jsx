import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Prevent mobile address-bar resize jumps during scroll pinning
ScrollTrigger.config({ ignoreMobileResize: true })

export default function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.09,
      duration: 1.2,
      smoothWheel: true,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })

    // Synchronize Lenis scroll position with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    // Drive Lenis tick loop exclusively via GSAP's internal ticker (single rAF loop)
    const tickerCallback = (time) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tickerCallback)
    gsap.ticker.lagSmoothing(0)

    if (typeof window !== 'undefined') {
      window.__lenis = lenis
      window.__ScrollTrigger = ScrollTrigger
    }

    return () => {
      gsap.ticker.remove(tickerCallback)
      lenis.destroy()
      if (typeof window !== 'undefined' && window.__lenis === lenis) {
        delete window.__lenis
      }
    }
  }, [])

  return children
}
