import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function useScrollAnimation() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // GSAP ScrollTrigger animations placeholder
    })

    return () => ctx.revert()
  }, [])
}

