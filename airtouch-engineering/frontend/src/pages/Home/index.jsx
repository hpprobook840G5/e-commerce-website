import BrandIntroduction from '../../components/sections/BrandIntroduction.jsx'
import CinematicExperience from '../../components/sections/CinematicExperience/CinematicExperience.jsx'
import FeaturedProducts from '../../components/sections/FeaturedProducts.jsx'
import ContactSection from '../../components/sections/ContactSection/ContactSection.jsx'

export default function Home() {
  return (
    <div className="w-full bg-zinc-950 text-white min-h-screen">
      {/* 3. Brand Introduction Section */}
      <BrandIntroduction />

      {/* 4. Cinematic Scroll Experience (Pre-rendered sequence + Three.js particles + GSAP Pin) */}
      <CinematicExperience />

      {/* 5. Featured Spare Parts Product Grid Section */}
      <FeaturedProducts />

      {/* 6. Contact Section */}
      <ContactSection />
    </div>
  )
}
