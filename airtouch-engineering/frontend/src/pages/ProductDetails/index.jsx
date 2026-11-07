import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Tag,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Truck,
  Heart,
  ShoppingCart,
  Zap,
  Minus,
  Plus,
  ChevronRight,
  AlertCircle,
  ArrowLeft,
  Check,
  Share2,
  Package,
  Wrench,
  Flame,
  Sun,
  Sliders,
  Shield,
  CircleDot,
  Layers,
} from 'lucide-react'
import { getProductById, getRelatedProducts } from '../../data/products.js'
import { fetchStorefrontProductById } from '../../services/productsApi.js'
import { useCartStore } from '../../store/cartStore.js'
import { useFavouritesStore } from '../../store/favouritesStore.js'
import ProductCard from '../../components/products/ProductCard.jsx'

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

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(() => getProductById(id))

  useEffect(() => {
    let isMounted = true
    const fallback = getProductById(id)
    if (fallback) setProduct(fallback)

    fetchStorefrontProductById(id).then((p) => {
      if (isMounted && p) {
        setProduct(p)
      }
    })
    return () => {
      isMounted = false
    }
  }, [id])

  const relatedProducts = useMemo(() => getRelatedProducts(product, 4), [product])

  // Zustand stores
  const addItem = useCartStore((state) => state.addItem)
  const isFavourite = useFavouritesStore((state) => state.isFavourite(product?.id))
  const toggleFavourite = useFavouritesStore((state) => state.toggleFavourite)

  // Local component states
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [pincodeInput, setPincodeInput] = useState('')
  const [pincodeStatus, setPincodeStatus] = useState(null)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const [isCopiedShare, setIsCopiedShare] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Scroll to top and reset state on ID change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setSelectedImageIndex(0)
    setQuantity(1)
    setPincodeStatus(null)
    setImageError(false)
    setIsAddedToCart(false)
  }, [id])

  // Update page title
  useEffect(() => {
    if (product) {
      document.title = `${product.name} | AirTouch Engineering`
    } else {
      document.title = 'Product Not Found | AirTouch Engineering'
    }
  }, [product])

  // Handle missing product gracefully
  if (!product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-zinc-950 text-zinc-100">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl backdrop-blur-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Component Not Found</h1>
            <p className="text-sm text-zinc-400">
              The requested part identifier &ldquo;<span className="text-zinc-200 font-mono">{id}</span>&rdquo; does
              not match any active product in the AirTouch catalog.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-black font-semibold text-sm transition-colors shadow-lg shadow-orange-500/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Prepared values
  const price = Number(product.price) || 0
  const mrp = Number(product.mrp || product.originalPrice || price)
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
  const stock = typeof product.stock === 'number' ? product.stock : 10
  const isOutOfStock = stock <= 0
  const rating = Number(product.rating) || 4.8
  const ratingCount = Number(product.ratingCount || product.reviewCount || 42)

  // Images gallery preparation
  const images = useMemo(() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images
    }
    const fallbackList = []
    if (product.image) fallbackList.push(product.image)
    if (product.secondaryImage) fallbackList.push(product.secondaryImage)
    return fallbackList.length > 0 ? fallbackList : ['/placeholder-part.jpg']
  }, [product])

  const activeImage = images[selectedImageIndex] || images[0]

  // Highlights fallback
  const highlights = useMemo(() => {
    if (Array.isArray(product.highlights) && product.highlights.length > 0) {
      return product.highlights
    }
    return [
      `High-precision engineering specifically designed for ${product.brand}`,
      'Direct bolt-on fitment with standard mounting brackets',
      'Track and street tested under severe thermal conditions',
      'Corrosion-resistant anodized finish with laser-etched AirTouch branding',
    ]
  }, [product])

  // Specifications fallback
  const specifications = useMemo(() => {
    if (Array.isArray(product.specifications) && product.specifications.length > 0) {
      return product.specifications
    }
    const rows = [
      { label: 'Brand', value: product.brand || 'AirTouch Apex' },
      { label: 'Category', value: product.categoryName || product.category || 'Performance Spare' },
      { label: 'Model Compatibility', value: (product.compatibility || []).join(', ') || 'Universal Fit' },
      { label: 'Country of Origin', value: 'India' },
      { label: 'Warranty', value: product.warranty || '1 Year AirTouch Replacement Warranty' },
    ]
    if (product.specs && typeof product.specs === 'object') {
      Object.entries(product.specs).forEach(([k, v]) => {
        // CamelCase / TitleCase format
        const formattedLabel = k.replace(/([A-Z])/g, ' $1').trim()
        rows.push({ label: formattedLabel, value: String(v) })
      })
    }
    return rows
  }, [product])

  // Promo offers fallback
  const offers = useMemo(() => {
    if (Array.isArray(product.offers) && product.offers.length > 0) {
      return product.offers
    }
    return [
      '10% Instant Discount on UPI Payments up to ₹500',
      'Flat ₹150 Cashback on orders above ₹1,999 with code AIRTOUCH150',
      'Complimentary express courier shipping on orders above ₹999',
    ]
  }, [product])

  // Compatibility list
  const compatibilityList = Array.isArray(product.compatibility) ? product.compatibility : []

  // Handlers
  const handleAddToCart = () => {
    if (isOutOfStock) return
    const success = addItem(product.id, quantity)
    if (success !== false) {
      setIsAddedToCart(true)
      setTimeout(() => setIsAddedToCart(false), 2000)
    }
  }

  const handleBuyNow = () => {
    if (isOutOfStock) return
    addItem(product.id, quantity)
    navigate('/checkout')
  }

  const handlePincodeCheck = (e) => {
    e.preventDefault()
    const cleanPin = pincodeInput.trim()
    if (!/^\d{6}$/.test(cleanPin)) {
      setPincodeStatus({
        valid: false,
        message: 'Please enter a valid 6-digit Indian PIN code.',
      })
      return
    }

    // Dummy realistic estimation
    const days = Number(product.deliveryDays) || 3
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + days)
    const options = { weekday: 'short', day: 'numeric', month: 'short' }
    const dateFormatted = targetDate.toLocaleDateString('en-IN', options)

    setPincodeStatus({
      valid: true,
      pincode: cleanPin,
      dateText: `Delivery by ${dateFormatted}`,
      shippingNote: price >= 999 ? 'FREE Delivery' : 'Standard Delivery ₹99',
    })
  }

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on AirTouch Engineering:`,
      url: window.location.href,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled or not supported
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      setIsCopiedShare(true)
      setTimeout(() => setIsCopiedShare(false), 2000)
    }
  }

  const CategoryIcon = getCategoryIcon(product.category)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-orange-500 selection:text-black">
      {/* Top Breadcrumb */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs sm:text-sm text-zinc-400">
            <Link to="/" className="hover:text-orange-400 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
            <Link to="/products" className="hover:text-orange-400 transition-colors">
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
            <Link
              to={`/products?category=${encodeURIComponent(product.category || '')}`}
              className="hover:text-orange-400 transition-colors capitalize"
            >
              {product.categoryName || product.category || 'Components'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
            <span className="text-zinc-200 font-medium truncate max-w-[160px] sm:max-w-xs" aria-current="page">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Product Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 pb-28 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ============================================================== */}
          {/* LEFT COLUMN: Gallery + Desktop Sticky Action Bar              */}
          {/* ============================================================== */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 self-start">
            {/* Main Image Frame */}
            <div className="relative aspect-square w-full rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4 sm:p-6 flex items-center justify-center overflow-hidden shadow-2xl group">
              {/* Subtle grid pattern background */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
                {product.featured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-orange-500 text-black shadow-md">
                    <Zap className="w-3 h-3 fill-current" />
                    Featured
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Favourite & Share Buttons */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors border border-zinc-700/60 backdrop-blur-sm"
                  aria-label="Share product"
                  title="Share product link"
                >
                  {isCopiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavourite(product.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border backdrop-blur-sm ${
                    isFavourite
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : 'bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700/60 text-zinc-300 hover:text-white'
                  }`}
                  aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                >
                  <Heart className={`w-5 h-5 ${isFavourite ? 'fill-current text-rose-500' : ''}`} />
                </button>
              </div>

              {/* Main Image or Fallback */}
              {!imageError && activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105 cursor-zoom-in"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-600 space-y-3">
                  <CategoryIcon className="w-24 h-24 stroke-[1.2] text-zinc-500" />
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                    {product.brand} Technical Part
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(idx)
                      setImageError(false)
                    }}
                    aria-label={`Show image ${idx + 1} of ${images.length}`}
                    aria-current={selectedImageIndex === idx}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-900 border-2 flex-shrink-0 transition-all p-1.5 ${
                      selectedImageIndex === idx
                        ? 'border-orange-500 shadow-md shadow-orange-500/20 ring-1 ring-orange-500'
                        : 'border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Desktop Action Buttons (Flipkart Left-Column Style) */}
            <div className="hidden lg:grid grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`w-full py-4 px-6 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-md ${
                  isOutOfStock
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    : isAddedToCart
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-zinc-900 hover:bg-zinc-850 text-orange-400 border border-orange-500/60 hover:border-orange-500 hover:text-orange-300'
                }`}
              >
                {isAddedToCart ? (
                  <>
                    <Check className="w-5 h-5" />
                    Added To Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 text-orange-400" />
                    Add To Cart
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className={`w-full py-4 px-6 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                  isOutOfStock
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black shadow-orange-500/25 active:scale-[0.99]'
                }`}
              >
                <Zap className="w-5 h-5 fill-current" />
                Buy Now
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: Info, Price, Offers, Specs, Compatibility        */}
          {/* ============================================================== */}
          <div className="lg:col-span-7 space-y-8">
            {/* Header: Brand, Title, Rating */}
            <div className="space-y-3 border-b border-zinc-800 pb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-orange-500 uppercase font-mono">
                  {product.brand}
                </span>
                {stock > 0 && stock <= 10 && (
                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    Only {stock} left in stock
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Rating and Reviews Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-xs font-bold shadow-sm">
                  <span>{rating.toFixed(1)}</span>
                  <Star className="w-3.5 h-3.5 fill-current text-white" />
                </div>
                <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                  {ratingCount.toLocaleString('en-IN')} Ratings &amp; Verified Reviews
                </span>
                <span className="hidden sm:inline text-zinc-700">•</span>
                <span className="inline-flex items-center gap-1 text-xs text-orange-400/90 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  AirTouch Certified Genuine
                </span>
              </div>
            </div>

            {/* Price Block */}
            <div className="space-y-2 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                {mrp > price && (
                  <>
                    <span className="text-lg text-zinc-500 line-through font-mono">
                      ₹{mrp.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-2">
                <span>Inclusive of all taxes</span>
                <span className="text-zinc-600">•</span>
                <span>Free delivery on orders over ₹999</span>
              </p>
            </div>

            {/* Quantity Selector & Stock Indicator (Desktop/Mobile inline) */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Quantity:
                </span>
                <div className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-1 text-sm font-mono font-semibold text-white min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                    disabled={quantity >= stock || isOutOfStock}
                    className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stock status indicator */}
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isOutOfStock ? 'bg-red-500' : stock <= 5 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-xs font-medium text-zinc-300">
                  {isOutOfStock
                    ? 'Out of Stock'
                    : stock <= 5
                    ? `Only ${stock} Units Available`
                    : 'In Stock — Ships within 24 Hours'}
                </span>
              </div>
            </div>

            {/* Available Offers Block (Flipkart Style) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                <Tag className="w-4 h-4 text-orange-400" />
                Available Offers
              </div>
              <div className="space-y-2">
                {offers.map((offerText, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60"
                  >
                    <Tag className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>{offerText}</span>
                      <button
                        type="button"
                        className="ml-2 text-orange-400 hover:underline font-semibold text-xs"
                      >
                        T&amp;C
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pincode & Delivery Estimation */}
            <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <Truck className="w-4 h-4 text-orange-400" />
                Check Delivery &amp; Services
              </div>
              <form onSubmit={handlePincodeCheck} className="flex gap-2 max-w-md">
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit Pincode"
                  className="flex-1 px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs uppercase tracking-wider transition-colors border border-zinc-700"
                >
                  Check
                </button>
              </form>

              {/* Status display */}
              {pincodeStatus && (
                <div
                  className={`text-xs p-3 rounded-lg flex items-start gap-2 ${
                    pincodeStatus.valid
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                      : 'bg-red-950/40 text-red-300 border border-red-800/50'
                  }`}
                >
                  {pincodeStatus.valid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white">
                          {pincodeStatus.dateText} | {pincodeStatus.shippingNote}
                        </div>
                        <div className="text-zinc-400 text-[11px] mt-0.5">
                          Delivery to PIN <span className="font-mono text-zinc-200">{pincodeStatus.pincode}</span> via AirTouch Express Courier.
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{pincodeStatus.message}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Fits These Motorcycles (Compatibility Chips) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-orange-400" />
                Fits These Motorcycles
              </div>
              {compatibilityList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {compatibilityList.map((bike, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-orange-500/50 transition-colors"
                    >
                      {bike}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800">
                  Universal Fit: Designed to adapt across all standard motorcycle frame brackets and handlebars.
                </p>
              )}
              <p className="text-[11px] text-zinc-500 italic">
                * Please cross-reference your specific chassis model year before assembly.
              </p>
            </div>

            {/* Highlights Section */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Product Highlights
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {highlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300 bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-800/40"
                  >
                    <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Description Section with Read More */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Description
              </h2>
              <div className="relative text-xs sm:text-sm text-zinc-300 leading-relaxed bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                <p className={!isDescriptionExpanded ? 'line-clamp-3' : ''}>
                  {product.description || product.shortDescription}
                </p>
                {(product.description || '').length > 180 && (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                    className="mt-2 text-xs font-semibold text-orange-400 hover:text-orange-300 focus:outline-none"
                  >
                    {isDescriptionExpanded ? 'Read less' : 'Read more...'}
                  </button>
                )}
              </div>
            </div>

            {/* Technical Specifications Table (Flipkart Style 2-Column) */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Specifications
              </h2>
              <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/40">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <tbody>
                    {specifications.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-zinc-800/60 last:border-0 ${
                          idx % 2 === 0 ? 'bg-zinc-900/60' : 'bg-transparent'
                        }`}
                      >
                        <td className="w-1/3 py-3 px-4 font-medium text-zinc-400 border-r border-zinc-800/60">
                          {row.label}
                        </td>
                        <td className="w-2/3 py-3 px-4 text-zinc-200 font-mono sm:font-sans">
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trust and Assurance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Genuine Warranty</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {product.warranty || '1 Year Direct Replacement'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">7 Days Return</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {product.returnPolicy || 'Replacement if defective'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-3">
                <Package className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Official Seller</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {product.seller || 'AirTouch Official Store'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RELATED PRODUCTS SECTION (Reusing ProductCard)                */}
        {/* ============================================================== */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 sm:mt-24 pt-12 border-t border-zinc-800 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-orange-500 font-mono">
                  Complementary Upgrades
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                  Similar Performance Components
                </h2>
              </div>
              <Link
                to={`/products?category=${encodeURIComponent(product.category || '')}`}
                className="text-xs sm:text-sm font-semibold text-orange-400 hover:text-orange-300 inline-flex items-center gap-1 transition-colors"
              >
                View all in {product.categoryName || product.category}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} viewMode="grid" />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ============================================================== */}
      {/* MOBILE STICKY BOTTOM BAR (Fixed at bottom on mobile screens)   */}
      {/* ============================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 p-3 pb-safe shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Price display */}
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-extrabold text-white font-mono leading-none truncate">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {mrp > price && (
              <span className="text-[11px] text-zinc-500 line-through font-mono mt-0.5">
                ₹{mrp.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`flex-1 py-3 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border ${
                isOutOfStock
                  ? 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
                  : isAddedToCart
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-zinc-900 text-orange-400 border-orange-500/50 hover:bg-zinc-800'
              }`}
            >
              {isAddedToCart ? (
                <>
                  <Check className="w-4 h-4" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md ${
                isOutOfStock
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-orange-500/20 active:scale-[0.98]'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
