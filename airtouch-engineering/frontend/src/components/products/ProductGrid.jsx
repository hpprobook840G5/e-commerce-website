import { motion, useReducedMotion } from 'framer-motion'
import { SearchX, RotateCcw } from 'lucide-react'
import ProductCard from './ProductCard.jsx'

export default function ProductGrid({
  products = [],
  isLoading = false,
  viewMode = 'grid',
  onQuickView,
  onResetFilters,
}) {
  const shouldReduceMotion = useReducedMotion()

  const gridContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.05,
        delayChildren: shouldReduceMotion ? 0 : 0.02,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.35,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  // ================= SKELETON LOADING STATE =================
  if (isLoading) {
    return (
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }
      >
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-zinc-900/40 border border-zinc-800/80 overflow-hidden animate-pulse flex flex-col"
          >
            <div className="aspect-[4/3] w-full bg-zinc-850/60" />
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-3 w-1/3 bg-zinc-800 rounded" />
                <div className="h-4 w-4/5 bg-zinc-750 rounded" />
                <div className="h-3 w-1/2 bg-zinc-800 rounded" />
              </div>
              <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                <div className="h-5 w-2/5 bg-zinc-750 rounded" />
                <div className="h-8 w-full bg-zinc-800 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ================= EMPTY STATE =================
  if (!products || products.length === 0) {
    return (
      <div className="py-20 px-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 mb-4 shadow-[0_0_24px_rgba(249,115,22,0.2)]">
          <SearchX className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-extrabold uppercase tracking-tight text-white mb-2">
          No Components Match Your Filters
        </h3>

        <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          We couldn't find any motorcycle components matching your current combination of category,
          brand, price range, or keywords.
        </p>

        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    )
  }

  // ================= LOADED PRODUCTS GRID =================
  return (
    <motion.div
      variants={gridContainerVariants}
      initial="hidden"
      animate="visible"
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'flex flex-col gap-4'
      }
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          viewMode={viewMode}
          onQuickView={onQuickView}
          variants={cardVariants}
        />
      ))}
    </motion.div>
  )
}

