import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShieldCheck, Wrench } from 'lucide-react'

/**
 * AirTouch Engineering - High-Performance Cart Item Row
 * Clean Flipkart-style item card with bike compatibility, quantity stepper,
 * struck-through MRP, savings tag, and accessible removal action.
 */
export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const shouldReduceMotion = useReducedMotion()

  if (!item) return null

  const id = item.productId || item.id
  const name = item.name || 'AirTouch Component'
  const brand = item.brand || 'AirTouch Apex'
  const price = Number(item.price) || 0
  const mrp = Number(item.mrp || item.originalPrice || price)
  const quantity = Number(item.quantity) || 1
  const lineTotal = Number(item.lineTotal !== undefined ? item.lineTotal : price * quantity)
  const stock = typeof item.stock === 'number' ? item.stock : 99
  const hasDiscount = mrp > price
  const discountPercent = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0
  const compatibilityList = Array.isArray(item.compatibility) ? item.compatibility : []

  const isMinQuantity = quantity <= 1
  const isMaxQuantity = quantity >= stock

  const handleDecrease = () => {
    if (quantity > 1) {
      onUpdateQuantity(id, quantity - 1)
    }
  }

  const handleIncrease = () => {
    if (quantity < stock) {
      onUpdateQuantity(id, quantity + 1)
    }
  }

  return (
    <motion.article
      layout={!shouldReduceMotion}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        height: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        overflow: 'hidden',
        transition: { duration: shouldReduceMotion ? 0 : 0.22, ease: 'easeInOut' },
      }}
      className="group relative rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-4 sm:p-5 transition-[border-color,box-shadow] hover:border-zinc-700/80"
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
        {/* 1. Product Image Thumbnail */}
        <Link
          to={`/products/${item.slug || id}`}
          className="relative w-full sm:w-28 sm:h-28 aspect-video sm:aspect-square rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800/80 shrink-0 flex items-center justify-center group-hover:border-orange-500/40 transition-colors"
        >
          {item.image ? (
            <img
              src={item.image}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-600">
              <Wrench className="w-8 h-8 text-orange-500/60" />
            </div>
          )}
          {hasDiscount && (
            <span className="absolute top-1.5 left-1.5 sm:hidden px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-500 text-black">
              {discountPercent}% OFF
            </span>
          )}
        </Link>

        {/* 2. Product Information Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Brand + Category */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold tracking-[0.2em] text-orange-400 uppercase">
                {brand}
              </span>
              {hasDiscount && (
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Product Title */}
            <Link to={`/products/${item.slug || id}`}>
              <h3 className="mt-1 text-sm sm:text-base font-bold text-white hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
                {name}
              </h3>
            </Link>

            {/* Compatibility info */}
            {compatibilityList.length > 0 && (
              <p className="mt-1.5 text-xs text-zinc-400 line-clamp-1">
                <span className="text-zinc-500 font-medium">Compatible with: </span>
                <span className="text-zinc-300">
                  {compatibilityList.slice(0, 3).join(', ')}
                  {compatibilityList.length > 3 ? ' +' + (compatibilityList.length - 3) + ' more' : ''}
                </span>
              </p>
            )}

            {/* Price Row */}
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-base sm:text-lg font-black text-white tracking-tight">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="text-xs text-zinc-500 line-through font-medium">
                  ₹{mrp.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">
                per unit
              </span>
            </div>
          </div>

          {/* 3. Controls & Actions Row */}
          <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-950 p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={handleDecrease}
                  disabled={isMinQuantity}
                  aria-label={`Decrease quantity of ${name}`}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span
                  aria-live="polite"
                  aria-atomic="true"
                  className="w-9 text-center font-bold text-xs sm:text-sm text-white select-none"
                >
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={isMaxQuantity}
                  aria-label={`Increase quantity of ${name}`}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {isMaxQuantity && (
                <span className="text-[11px] text-amber-500 font-medium">
                  Max stock reached
                </span>
              )}
            </div>

            {/* Subtotal for line item & Remove action */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                  Subtotal
                </span>
                <span className="text-base font-extrabold text-orange-500">
                  ₹{lineTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="h-6 w-px bg-zinc-800 hidden sm:block" />

              <button
                type="button"
                onClick={() => onRemove(id)}
                aria-label={`Remove ${name} from cart`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
