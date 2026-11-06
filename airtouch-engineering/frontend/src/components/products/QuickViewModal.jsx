import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, ArrowRight, ShieldCheck, Truck, RotateCcw, Heart } from 'lucide-react'
import RatingStars from './RatingStars.jsx'
import Badge from './Badge.jsx'
import GradientButton from './GradientButton.jsx'
import { useCartStore } from '../../store/cartStore.js'

export default function QuickViewModal({ product, isOpen, onClose }) {
  const [selectedImage, setSelectedImage] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)

  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image || product.imageUrl)
      setQuantity(1)
      setIsAdded(false)

      // Check wishlist
      try {
        const saved = JSON.parse(localStorage.getItem('airtouch-wishlist') || '[]')
        setIsWishlisted(saved.includes(product.id))
      } catch {
        setIsWishlisted(false)
      }
    }
  }, [product])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !product) return null

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product)
    }
    setIsAdded(true)
    setTimeout(() => {
      setIsAdded(false)
    }, 1800)
  }

  const toggleWishlist = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('airtouch-wishlist') || '[]')
      let updated = []
      if (saved.includes(product.id)) {
        updated = saved.filter((id) => id !== product.id)
        setIsWishlisted(false)
      } else {
        updated = [...saved, product.id]
        setIsWishlisted(true)
      }
      localStorage.setItem('airtouch-wishlist', JSON.stringify(updated))
      window.dispatchEvent(new Event('wishlist-updated'))
    } catch {
      // Fallback
    }
  }

  const price = Number(product.price || 0)
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null
  const hasDiscount = originalPrice && originalPrice > price

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
      >
        {/* Backdrop click */}
        <div
          className="fixed inset-0 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black overflow-hidden z-10 my-8 flex flex-col md:flex-row max-h-[90vh]"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Column: Image Gallery */}
          <div className="md:w-1/2 p-6 bg-gradient-to-br from-zinc-900/80 via-zinc-950 to-black flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-800/80">
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
              <img
                src={selectedImage || product.image || product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                {product.badges?.map((badge, idx) => (
                  <Badge key={idx} text={badge} />
                ))}
              </div>
            </div>

            {/* Thumbnail Row */}
            <div className="flex items-center gap-3 mt-4">
              {[product.image || product.imageUrl, product.secondaryImage]
                .filter(Boolean)
                .map((imgSrc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(imgSrc)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImage === imgSrc
                        ? 'border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                        : 'border-zinc-800 hover:border-zinc-600 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgSrc}
                      alt={`View ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
            </div>
          </div>

          {/* Right Column: Product Details & Actions */}
          <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Brand & Category Eyebrow */}
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                <span>{product.brand || 'AirTouch Apex'}</span>
                <span className="text-zinc-500 font-mono">ID: {product.id}</span>
              </div>

              {/* Product Title */}
              <h2
                id="quick-view-title"
                className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase"
              >
                {product.name}
              </h2>

              {/* Rating & Review */}
              <div className="mt-3 flex items-center gap-3">
                <RatingStars
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                />
                <span className="text-zinc-600">|</span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  {product.stock > 10 ? 'In Stock' : `Low Stock (${product.stock} left)`}
                </span>
              </div>

              {/* Price Row */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-orange-500 tracking-tight">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <span className="text-sm font-medium text-zinc-500 line-through">
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {product.bikeType && (
                  <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase">
                    {Array.isArray(product.bikeType)
                      ? product.bikeType.join(' · ')
                      : product.bikeType}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mt-4 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {product.description}
              </p>

              {/* Key Specs */}
              {product.specs && (
                <div className="mt-5 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-850">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Key Technical Specifications
                  </h4>
                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-zinc-500 font-medium">{key}:</dt>
                        <dd className="text-zinc-200 font-semibold">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-5 border-t border-zinc-800/80">
              <div className="flex items-center gap-3">
                {/* Quantity adjuster */}
                <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stock || 99, q + 1))
                    }
                    disabled={quantity >= (product.stock || 99)}
                    className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart */}
                <GradientButton
                  onClick={handleAddToCart}
                  isAdded={isAdded}
                  fullWidth
                  size="md"
                >
                  Add {quantity > 1 ? `(${quantity})` : ''} to Cart
                </GradientButton>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={toggleWishlist}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                    isWishlisted
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              {/* View Full Product Details Link */}
              <div className="mt-4 flex items-center justify-between text-xs">
                <Link
                  to={`/products/${product.id}`}
                  onClick={onClose}
                  className="font-bold text-orange-400 hover:text-orange-300 inline-flex items-center gap-1 uppercase tracking-wider transition-colors"
                >
                  <span>Open Full Product Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-4 text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-zinc-400" /> Free Dispatch
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" /> Warranty
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

