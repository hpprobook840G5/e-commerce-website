import BrandIntroduction from '../../components/sections/BrandIntroduction.jsx'
import CinematicExperience from '../../components/sections/CinematicExperience/CinematicExperience.jsx'
import { Link } from 'react-router-dom'
import { ArrowRight, Wrench, Shield, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="w-full bg-zinc-950 text-white min-h-screen">
      {/* 3. Brand Introduction Section */}
      <BrandIntroduction />

      {/* 4. Cinematic Scroll Experience (Pre-rendered sequence + Three.js particles + GSAP Pin) */}
      <CinematicExperience />

      {/* 5. Featured Products Section Placeholder */}
      <section
        id="featured-products"
        aria-label="Featured Products"
        className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-900"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 pb-4 border-b border-zinc-800 gap-4">
          <div>
            <span className="text-xs font-bold tracking-[0.25em] text-orange-500 uppercase">
              HIGH-PERFORMANCE INVENTORY
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight uppercase mt-1">
              Featured Spare Parts
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-wider group"
          >
            <span>VIEW ALL COMPONENTS</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-850 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-500 mb-4">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wide text-white mb-2">
                Braking Systems
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Carbon-ceramic and sintered brake pads engineered for track-level stopping power and zero fade.
              </p>
            </div>
            <Link
              to="/products"
              className="mt-6 text-xs font-bold text-orange-500 hover:text-white uppercase tracking-wider inline-flex items-center gap-1"
            >
              EXPLORE BRAKES <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-850 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-500 mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wide text-white mb-2">
                Engine & Transmission
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Precision CNC clutch assemblies, racing sprockets, and performance drive components.
              </p>
            </div>
            <Link
              to="/products"
              className="mt-6 text-xs font-bold text-orange-500 hover:text-white uppercase tracking-wider inline-flex items-center gap-1"
            >
              EXPLORE TRANSMISSION <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-850 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-500 mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wide text-white mb-2">
                Chassis & Protection
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Heavy-duty crash guards, slider kits, and structural reinforcements engineered for endurance.
              </p>
            </div>
            <Link
              to="/products"
              className="mt-6 text-xs font-bold text-orange-500 hover:text-white uppercase tracking-wider inline-flex items-center gap-1"
            >
              EXPLORE CHASSIS <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Contact & About Section Anchor */}
      <section
        id="about"
        aria-label="About AirTouch Engineering"
        className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-900"
      >
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs font-bold tracking-[0.25em] text-orange-500 uppercase">
            ABOUT AIRTOUCH ENGINEERING
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight uppercase text-white mt-2 mb-4">
            Built for Riders Who Demand Perfection
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-8">
            Every component curated by AirTouch Engineering undergoes strict tolerance tests.
            Whether you are rebuilding a motorcycle or pushing for lap times, we supply the reliability
            and performance required on road and track.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs uppercase tracking-wider transition-colors"
            >
              CONTACT ENGINEERING TEAM
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
