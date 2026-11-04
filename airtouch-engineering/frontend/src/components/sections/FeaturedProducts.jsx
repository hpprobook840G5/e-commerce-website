import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import ProductCard from '../products/ProductCard.jsx'
import { DUMMY_FEATURED_PRODUCTS } from './dummyProducts.js'

/**
 * Featured Spare Parts Section (Homepage)
 * Preserves the exact section header ("HIGH-PERFORMANCE INVENTORY", "FEATURED SPARE PARTS",
 * "VIEW ALL COMPONENTS ->") and renders an 8-card responsive product grid:
 * - Desktop (>=1024px): 4 columns x 2 rows
 * - Tablet (768-1023px): 2 columns x 4 rows
 * - Mobile (<768px): 1 column stacked
 */
export default function FeaturedProducts() {
  const shouldReduceMotion = useReducedMotion()

  // TODO: Replace DUMMY_FEATURED_PRODUCTS with a real backend / Supabase API fetch
  // (e.g. GET /api/products?featured=true&limit=8 via services/api.js) once the products API is ready.
  const products = DUMMY_FEATURED_PRODUCTS

  const gridContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.04,
      },
    },
  }

  const cardItemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  return (
    <section
      id="featured-products"
      aria-label="Featured Products"
      className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-900 overflow-x-clip"
    >
      {/* Section Header (kept verbatim) */}
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

      {/* 8-Card Responsive Product Grid (Desktop: 4x2, Tablet: 2x4, Mobile: 1x8) */}
      <motion.div
        data-testid="featured-products-grid"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            variants={cardItemVariants}
          />
        ))}
      </motion.div>
    </section>
  )
}

