import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  CircleDot,
  Flame,
  Layers,
  Shield,
  Sliders,
  Sun,
  Wrench,
  Zap,
} from 'lucide-react'

/**
 * Resolves a category-appropriate Lucide icon for the placeholder image area
 */
function getCategoryIcon(category = '') {
  const normalized = category.toLowerCase()
  if (normalized.includes('brak')) return Wrench
  if (normalized.includes('engine') || normalized.includes('transmission')) return Zap
  if (normalized.includes('exhaust')) return Flame
  if (normalized.includes('light') || normalized.includes('headlight')) return Sun
  if (normalized.includes('handlebar') || normalized.includes('grip')) return Sliders
  if (normalized.includes('chassis') || normalized.includes('protection')) return Shield
  if (normalized.includes('tire') || normalized.includes('wheel')) return CircleDot
  if (normalized.includes('seat') || normalized.includes('saddle')) return Layers
  return Wrench
}

const DEFAULT_CARD_VARIANTS = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

/**
 * Reusable AirTouch Engineering ProductCard Component
 * Extended from scaffold to support offer badges, strikethrough original pricing,
 * category eyebrow labels, dev-only placeholder media blocks, and React Router navigation.
 */
export default function ProductCard({
  product,
  id: propId,
  name: propName,
  title: propTitle,
  category: propCategory,
  price: propPrice = 0,
  originalPrice: propOriginalPrice,
  discountPercent: propDiscountPercent,
  imagePlaceholder: propImagePlaceholder = true,
  imageUrl: propImageUrl,
  variants = DEFAULT_CARD_VARIANTS,
}) {
  const shouldReduceMotion = useReducedMotion()

  const id = product?.id ?? propId ?? 'placeholder'
  const displayName = product?.name ?? propName ?? propTitle ?? 'Product Name'
  const category = product?.category ?? propCategory ?? 'Spare Part'
  const price = Number(product?.price ?? propPrice ?? 0)
  const originalPrice =
    product?.originalPrice !== undefined ? Number(product.originalPrice) : propOriginalPrice
  const hasValidDiscount = originalPrice && originalPrice > price
  const discountPercent =
    product?.discountPercent ??
    propDiscountPercent ??
    (hasValidDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : null)
  const imagePlaceholder = product?.imagePlaceholder ?? propImagePlaceholder
  const imageUrl = product?.imageUrl ?? propImageUrl ?? null

  const CategoryIcon = getCategoryIcon(category)

  return (
    <motion.article
      variants={variants}
      whileHover={
        shouldReduceMotion
          ? undefined
          : { y: -6, transition: { duration: 0.22, ease: 'easeOut' } }
      }
      className="group relative rounded-xl bg-zinc-900/60 border border-zinc-800/90 hover:border-orange-500/60 hover:shadow-[0_12px_32px_-8px_rgba(249,115,22,0.22)] transition-[border-color,box-shadow] duration-200 overflow-hidden flex flex-col justify-between w-full min-w-0"
    >
      <Link
        to={`/products/${id}`}
        aria-label={`${displayName} - ₹${price.toLocaleString('en-IN')}`}
        className="flex flex-col justify-between h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-inset"
      >
        {/* 1. Image Area */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border-b border-zinc-800/80 flex flex-col items-center justify-center">
          {/* Subtle ambient radial glow on hover */}
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.12),transparent_70%)] opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            aria-hidden="true"
          />

          {/* 2. Offer Badge (Only shown when discountPercent exists) */}
          {Boolean(discountPercent && discountPercent > 0) && (
            <span
              data-testid="product-offer-badge"
              className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-orange-500 text-black font-extrabold text-[11px] leading-none tracking-wider uppercase shadow-[0_0_16px_rgba(249,115,22,0.35)]"
            >
              -{discountPercent}%
            </span>
          )}

          {/* TODO: Replace the placeholder block below with a real <img> tag once product images are available from backend / Supabase Storage:
              <img
                src={imageUrl}
                alt={displayName}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
          */}
          {!imagePlaceholder && imageUrl ? (
            <img
              src={imageUrl}
              alt={displayName}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center select-none">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-500 group-hover:scale-110 group-hover:border-orange-500/50 transition-transform duration-200">
                <CategoryIcon className="w-6 h-6" />
              </div>
              {import.meta.env.DEV && (
                <span className="mt-2.5 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                  Image coming soon
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5 flex flex-col flex-1 justify-between">
          <div>
            {/* 3. Category Label */}
            <span className="block text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-1.5">
              {category}
            </span>

            {/* 4. Product Name (1-2 lines, truncated with ellipsis) */}
            <h3
              title={displayName}
              className="text-base font-bold tracking-wide text-white group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug"
            >
              {displayName}
            </h3>
          </div>

          <div className="mt-5">
            {/* 5. Price Row */}
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-lg font-extrabold text-orange-500 tracking-tight">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {hasValidDiscount && (
                <span className="text-xs font-medium text-zinc-500 line-through">
                  ₹{Number(originalPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* 6. Bottom Action Link (matches existing "EXPLORE BRAKES ->" link style) */}
            <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-orange-500 group-hover:text-white uppercase tracking-wider inline-flex items-center gap-1 transition-colors">
                <span>VIEW DETAILS</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
