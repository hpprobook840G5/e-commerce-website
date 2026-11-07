import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Heart,
  Eye,
  ArrowRight,
  CircleDot,
  Flame,
  Layers,
  Shield,
  Sliders,
  Sun,
  Wrench,
  Zap,
  ShoppingCart,
} from 'lucide-react'
import Badge from './Badge.jsx'
import RatingStars from './RatingStars.jsx'
import GradientButton from './GradientButton.jsx'
import { useCartStore } from '../../store/cartStore.js'

function getCategoryIcon(category = '') {
  const normalized = category.toLowerCase()
  if (normalized.includes('brak') || normalized.includes('caliper') || normalized.includes('rotor')) return Wrench
  if (
    normalized.includes('engine') ||
    normalized.includes('transmission') ||
    normalized.includes('drive') ||
    normalized.includes('clutch') ||
    normalized.includes('gearbox') ||
    normalized.includes('shifter')
  )
    return Zap
  if (normalized.includes('exhaust') || normalized.includes('muffler') || normalized.includes('header')) return Flame
  if (normalized.includes('light') || normalized.includes('headlight') || normalized.includes('lamp')) return Sun
  if (
    normalized.includes('handlebar') ||
    normalized.includes('grip') ||
    normalized.includes('lever') ||
    normalized.includes('mirror') ||
    normalized.includes('control')
  )
    return Sliders
  if (
    normalized.includes('chassis') ||
    normalized.includes('protection') ||
    normalized.includes('cage') ||
    normalized.includes('slider') ||
    normalized.includes('suspension')
  )
    return Shield
  if (normalized.includes('tire') || normalized.includes('wheel') || normalized.includes('rim')) return CircleDot
  if (normalized.includes('seat') || normalized.includes('saddle') || normalized.includes('cowl') || normalized.includes('pillion')) return Layers
  return Wrench
}

const DEFAULT_CARD_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

export default function ProductCard({
  product,
  id: propId,
  name: propName,
  title: propTitle,
  brand: propBrand,
  category: propCategory,
  price: propPrice = 0,
  originalPrice: propOriginalPrice,
  discountPercent: propDiscountPercent,
  rating: propRating,
  reviewCount: propReviewCount,
  badges: propBadges,
  bikeType: propBikeType,
  image: propImage,
  imageUrl: propImageUrl,
  secondaryImage: propSecondaryImage,
  imagePlaceholder: propImagePlaceholder,
  viewMode = 'grid', // 'grid' | 'list'
  onQuickView,
  variants = DEFAULT_CARD_VARIANTS,
}) {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const addItem = useCartStore((state) => state.addItem)
  const items = useCartStore((state) => state.items)

  const id = product?.id ?? propId ?? 'part-unknown'
  const displayName = product?.name ?? propName ?? propTitle ?? 'AirTouch Component'
  const brand = product?.brand ?? propBrand ?? 'AirTouch Apex'
  const category = product?.categoryName ?? product?.category ?? propCategory ?? 'Spare Part'
  const price = Number(product?.price ?? propPrice ?? 0)
  const originalPrice =
    product?.originalPrice !== undefined ? Number(product.originalPrice) : propOriginalPrice
  const hasValidDiscount = originalPrice && originalPrice > price
  const discountPercent =
    product?.discountPercent ??
    propDiscountPercent ??
    (hasValidDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : null)
  const rating = product?.rating ?? propRating ?? 4.8
  const reviewCount = product?.reviewCount ?? propReviewCount ?? 45
  const badges = product?.badges ?? propBadges ?? (discountPercent ? [`Sale -${discountPercent}%`] : [])
  const bikeType = product?.bikeType ?? propBikeType ?? null
  const stock = Number(product?.stock !== undefined ? product.stock : 15)
  const isOutOfStock = stock <= 0

  const cartItem = items.find((i) => (i.productId || i.id) === id)
  const inCartQty = cartItem ? cartItem.quantity : 0

  const mainImage = product?.image ?? product?.imageUrl ?? propImage ?? propImageUrl
  const secondaryImage = product?.secondaryImage ?? propSecondaryImage ?? null
  const imagePlaceholder = product?.imagePlaceholder ?? propImagePlaceholder ?? (!mainImage)

  const [isHovered, setIsHovered] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Sync wishlist status
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('airtouch-wishlist') || '[]')
      setIsWishlisted(saved.includes(id))
    } catch {
      setIsWishlisted(false)
    }
  }, [id])

  // Listen to cross-component wishlist events
  useEffect(() => {
    const handleWishlistUpdate = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('airtouch-wishlist') || '[]')
        setIsWishlisted(saved.includes(id))
      } catch {
        // ignore
      }
    }
    window.addEventListener('wishlist-updated', handleWishlistUpdate)
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate)
  }, [id])

  const handleToggleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const saved = JSON.parse(localStorage.getItem('airtouch-wishlist') || '[]')
      let updated = []
      if (saved.includes(id)) {
        updated = saved.filter((item) => item !== id)
        setIsWishlisted(false)
      } else {
        updated = [...saved, id]
        setIsWishlisted(true)
      }
      localStorage.setItem('airtouch-wishlist', JSON.stringify(updated))
      window.dispatchEvent(new Event('wishlist-updated'))
    } catch {
      // ignore
    }
  }

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    addItem(id, 1)
    setIsAdded(true)
    setTimeout(() => {
      setIsAdded(false)
    }, 1500)
  }

  const handleBuyNow = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    addItem(product || id, 1)
    navigate('/checkout')
  }

  const handleQuickViewClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onQuickView) {
      onQuickView(product || { id, name: displayName, price, originalPrice, category, brand, image: mainImage, secondaryImage, rating, reviewCount, badges, bikeType })
    }
  }

  const CategoryIcon = getCategoryIcon(category)

  // ================= LIST VIEW LAYOUT =================
  if (viewMode === 'list') {
    return (
      <motion.article
        variants={variants}
        whileHover={
          shouldReduceMotion
            ? undefined
            : { y: -3, transition: { duration: 0.2, ease: 'easeOut' } }
        }
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative rounded-xl bg-zinc-900/60 border border-zinc-800/90 hover:border-orange-500/60 hover:shadow-[0_12px_32px_-8px_rgba(249,115,22,0.22)] transition-[border-color,box-shadow] duration-200 overflow-hidden flex flex-col sm:flex-row w-full min-w-0"
      >
        {/* Left: Image Container */}
        <Link
          to={`/products/${id}`}
          className="relative w-full sm:w-64 sm:min-w-[240px] aspect-[4/3] sm:aspect-square overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-zinc-800/80 shrink-0"
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.12),transparent_70%)] opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            aria-hidden="true"
          />

          {/* Badges Top-Left */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 pointer-events-none">
            {badges.map((badge, idx) => (
              <Badge key={idx} text={badge} />
            ))}
          </div>

          {/* Image with zoom and secondary swap */}
          {!imagePlaceholder && mainImage ? (
            <div className="relative w-full h-full">
              <img
                src={mainImage}
                alt={displayName}
                loading="lazy"
                className={`w-full h-full object-cover transition-all duration-500 ${
                  isHovered && secondaryImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                }`}
              />
              {secondaryImage && (
                <img
                  src={secondaryImage}
                  alt={`${displayName} alternate`}
                  loading="lazy"
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                    isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                  }`}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-500">
                <CategoryIcon className="w-6 h-6" />
              </div>
            </div>
          )}
        </Link>

        {/* Right: Content details */}
        <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold tracking-[0.2em] text-orange-400 uppercase">
                {brand} · {category}
              </span>

              {bikeType && (
                <span className="text-[10px] font-semibold text-zinc-500 uppercase px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                  {Array.isArray(bikeType) ? bikeType.join(', ') : bikeType}
                </span>
              )}
            </div>

            <Link to={`/products/${id}`}>
              <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors leading-snug line-clamp-2">
                {displayName}
              </h3>
            </Link>

            <div className="mt-2.5 flex items-center gap-3">
              <RatingStars rating={rating} reviewCount={reviewCount} />
            </div>

            {product?.description && (
              <p className="mt-3 text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-extrabold text-orange-500 tracking-tight">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {hasValidDiscount && (
                <span className="text-xs font-medium text-zinc-500 line-through">
                  ₹{Number(originalPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleWishlist}
                aria-label="Add to wishlist"
                className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'bg-rose-500/10 border-rose-500/50 text-rose-500'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
              </button>

              {onQuickView && (
                <button
                  type="button"
                  onClick={handleQuickViewClick}
                  aria-label="Quick preview"
                  className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}

              <div className="flex flex-col gap-2 shrink-0 min-w-[120px]">
                {isOutOfStock ? (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="w-full px-3 py-1.5 text-xs min-h-[36px] uppercase tracking-wider font-bold rounded-lg bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50 flex items-center justify-center"
                  >
                    Out of stock
                  </button>
                ) : inCartQty > 0 ? (
                  <Link
                    to="/cart"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`In cart with quantity ${inCartQty}. Go to cart`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/50 hover:bg-orange-500/25 text-orange-400 hover:text-orange-300 font-bold text-xs uppercase tracking-wider transition-colors min-h-[36px]"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-orange-400" />
                    <span>In cart · Qty {inCartQty}</span>
                  </Link>
                ) : (
                  <GradientButton
                    size="sm"
                    fullWidth
                    isAdded={isAdded}
                    onClick={handleAddToCart}
                    className="shrink-0"
                  >
                    Add to Cart
                  </GradientButton>
                )}
                <div className="sr-only" aria-live="polite">
                  {isAdded ? `${displayName} added to your cart.` : ''}
                </div>

                {/* Buy Now Button */}
                {isOutOfStock ? (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    aria-label={`Buy ${displayName} now`}
                    className="w-full px-3 py-1.5 text-xs min-h-[36px] uppercase tracking-wider font-bold rounded-lg bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50 flex items-center justify-center"
                  >
                    Buy Now
                  </button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleBuyNow}
                    aria-label={`Buy ${displayName} now`}
                    whileHover={
                      shouldReduceMotion
                        ? undefined
                        : { scale: 1.02, transition: { duration: 0.18 } }
                    }
                    whileTap={
                      shouldReduceMotion
                        ? undefined
                        : { scale: 0.96, transition: { duration: 0.12 } }
                    }
                    className="w-full px-3 py-1.5 text-xs min-h-[36px] uppercase tracking-wider font-extrabold rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:shadow-[0_0_28px_rgba(249,115,22,0.55)] flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span>Buy Now</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    )
  }

  // ================= GRID VIEW LAYOUT (DEFAULT) =================
  return (
    <motion.article
      variants={variants}
      whileHover={
        shouldReduceMotion
          ? undefined
          : { y: -6, transition: { duration: 0.22, ease: 'easeOut' } }
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-xl bg-zinc-900/60 border border-zinc-800/90 hover:border-orange-500/60 hover:shadow-[0_12px_32px_-8px_rgba(249,115,22,0.22)] transition-[border-color,box-shadow] duration-200 overflow-hidden flex flex-col justify-between w-full min-w-0"
    >
      <div className="flex flex-col justify-between h-full w-full">
        {/* 1. Image Area with Hover Zoom & Secondary Image Swap */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border-b border-zinc-800/80 flex items-center justify-center">
          {/* Ambient Glow */}
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.12),transparent_70%)] opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            aria-hidden="true"
          />

          {/* Badges (Top-Left) */}
          <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1 pointer-events-none">
            {badges.slice(0, 2).map((badge, idx) => (
              <Badge key={idx} text={badge} />
            ))}
          </div>

          {/* Wishlist Button (Top-Right) */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
              isWishlisted
                ? 'bg-rose-500/20 border-rose-500 text-rose-500 opacity-100'
                : 'bg-zinc-950/80 border-zinc-700/60 text-zinc-400 hover:text-white opacity-80 group-hover:opacity-100'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
          </button>

          {/* Quick View Button (Slides/Fades in on hover) */}
          {onQuickView && (
            <button
              type="button"
              onClick={handleQuickViewClick}
              aria-label="Quick view product details"
              className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-zinc-950/90 hover:bg-orange-500 text-zinc-300 hover:text-black border border-zinc-700 hover:border-orange-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-black/50 cursor-pointer backdrop-blur-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Quick View</span>
            </button>
          )}

          {/* Product Image Link */}
          <Link
            to={`/products/${id}`}
            aria-label={`View details for ${displayName}`}
            className="w-full h-full flex items-center justify-center"
          >
            {!imagePlaceholder && mainImage ? (
              <div className="relative w-full h-full">
                <img
                  src={mainImage}
                  alt={displayName}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    isHovered && secondaryImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                  }`}
                />
                {secondaryImage && (
                  <img
                    src={secondaryImage}
                    alt={`${displayName} secondary angle`}
                    loading="lazy"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                      isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                    }`}
                  />
                )}
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center select-none">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-500 group-hover:scale-110 group-hover:border-orange-500/50 transition-transform duration-200">
                  <CategoryIcon className="w-6 h-6" />
                </div>
                <span className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                  AirTouch Spec
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* 2. Card Body */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
          <div>
            {/* Brand & Category Label */}
            <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-1">
              <span>{brand}</span>
              <span className="text-orange-500/90">{category}</span>
            </div>

            {/* Product Title (2-line clamp) */}
            <Link to={`/products/${id}`}>
              <h3
                title={displayName}
                className="text-sm sm:text-base font-bold tracking-wide text-white group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug min-h-[2.5rem]"
              >
                {displayName}
              </h3>
            </Link>

            {/* Star Rating */}
            <div className="mt-2 flex items-center justify-between">
              <RatingStars rating={rating} reviewCount={reviewCount} />
              {bikeType && (
                <span className="text-[9px] font-semibold text-zinc-500 uppercase">
                  {Array.isArray(bikeType) ? bikeType[0] : bikeType}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-zinc-800/80">
            {/* Price Row */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-lg font-extrabold text-orange-500 tracking-tight">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {hasValidDiscount && (
                <span className="text-xs font-medium text-zinc-500 line-through">
                  ₹{Number(originalPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Action Buttons (Vertically Stacked) */}
            <div className="flex flex-col gap-2">
              {/* Add to Cart / In Cart / Out of Stock Button */}
              {isOutOfStock ? (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="w-full px-3 py-2 text-xs min-h-[38px] uppercase tracking-wider font-bold rounded-lg bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50 flex items-center justify-center"
                >
                  Out of stock
                </button>
              ) : inCartQty > 0 ? (
                <Link
                  to="/cart"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`In cart with quantity ${inCartQty}. Go to cart`}
                  className="w-full px-3 py-2 text-xs min-h-[38px] uppercase tracking-wider font-extrabold rounded-lg bg-orange-500/15 border border-orange-500/50 hover:bg-orange-500/25 text-orange-400 hover:text-orange-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-orange-400" />
                  <span>In cart · Qty {inCartQty}</span>
                </Link>
              ) : (
                <GradientButton
                  size="sm"
                  fullWidth
                  isAdded={isAdded}
                  onClick={handleAddToCart}
                  className="min-h-[38px] py-2"
                >
                  Add to Cart
                </GradientButton>
              )}
              <div className="sr-only" aria-live="polite">
                {isAdded ? `${displayName} added to your cart.` : ''}
              </div>

              {/* Buy Now Button */}
              {isOutOfStock ? (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  aria-label={`Buy ${displayName} now`}
                  className="w-full px-3 py-2 text-xs min-h-[38px] uppercase tracking-wider font-bold rounded-lg bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50 flex items-center justify-center"
                >
                  Buy Now
                </button>
              ) : (
                <motion.button
                  type="button"
                  onClick={handleBuyNow}
                  aria-label={`Buy ${displayName} now`}
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : { scale: 1.02, transition: { duration: 0.18 } }
                  }
                  whileTap={
                    shouldReduceMotion
                      ? undefined
                      : { scale: 0.96, transition: { duration: 0.12 } }
                  }
                  className="w-full px-3 py-2 text-xs min-h-[38px] uppercase tracking-wider font-extrabold rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:shadow-[0_0_28px_rgba(249,115,22,0.55)] flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>Buy Now</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
