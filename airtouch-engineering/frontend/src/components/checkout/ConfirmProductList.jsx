import { Package, AlertTriangle, Truck } from 'lucide-react'
import { formatINR } from './priceSummary.js'
import { DEFAULT_DELIVERY_DAYS } from '../../config/checkout.js'

export function computeDeliveryDate(deliveryDays = DEFAULT_DELIVERY_DAYS) {
  const date = new Date()
  const days = Number(deliveryDays) || DEFAULT_DELIVERY_DAYS
  date.setDate(date.getDate() + days)

  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export default function ConfirmProductList({ items = [], skippedCount = 0 }) {
  return (
    <div className="space-y-4">
      {/* Notice if any item was skipped because it no longer exists */}
      {skippedCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Some items are no longer available and were skipped.</span>
        </div>
      )}

      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 divide-y divide-zinc-800/80 overflow-hidden shadow-md">
        {items.map((item) => {
          const price = Number(item.price) || 0
          const mrp = Number(item.mrp || item.originalPrice || price)
          const qty = Number(item.quantity) || 1
          const lineTotal = price * qty
          const hasDiscount = mrp > price
          const discountPct = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0
          const isOutOfStock = typeof item.stock === 'number' && item.stock <= 0

          // Compatibility formatted string
          let compatText = null
          if (Array.isArray(item.compatibility) && item.compatibility.length > 0) {
            const firstTwo = item.compatibility.slice(0, 2).join(', ')
            const remaining = item.compatibility.length - 2
            compatText = remaining > 0 ? `${firstTwo} +${remaining} more` : firstTwo
          }

          // Delivery date
          const deliveryDays = item.deliveryDays || DEFAULT_DELIVERY_DAYS
          const deliveryByText = computeDeliveryDate(deliveryDays)

          const imageSrc =
            item.image ||
            (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null)

          return (
            <div key={item.productId || item.id} className="p-4 sm:p-5 space-y-3">
              <div className="flex items-start gap-3.5 sm:gap-4">
                {/* Product Thumbnail */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-zinc-600" aria-hidden="true" />
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    {/* Name: 1 line mobile, 2 lines desktop */}
                    <h3 className="text-xs sm:text-sm font-semibold text-white truncate sm:line-clamp-2 leading-snug">
                      {item.name}
                    </h3>
                  </div>

                  {/* Brand */}
                  {item.brand && (
                    <p className="text-[11px] sm:text-xs text-zinc-400 font-medium">
                      {item.brand}
                    </p>
                  )}

                  {/* Compatibility Line */}
                  {compatText && (
                    <p className="text-[11px] sm:text-xs text-zinc-500 truncate" title={item.compatibility.join(', ')}>
                      <span className="text-zinc-400 font-medium">Fits:</span> {compatText}
                    </p>
                  )}

                  {/* Price Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-sm sm:text-base font-bold text-white font-mono">
                      {formatINR(price)}
                    </span>

                    {hasDiscount && (
                      <>
                        <span className="text-xs text-zinc-500 line-through font-mono">
                          {formatINR(mrp)}
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {discountPct}% off
                        </span>
                      </>
                    )}

                    <span className="text-xs text-zinc-400 ml-auto font-mono">
                      Qty: <span className="font-bold text-zinc-200">{qty}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-row: Line Total & Delivery Date */}
              <div className="pt-2 border-t border-zinc-800/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Truck className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
                  <span>
                    Delivery by <strong className="text-white">{deliveryByText}</strong>
                  </span>
                </div>

                <div className="text-zinc-400">
                  Item Total:{' '}
                  <span className="font-bold font-mono text-white text-xs sm:text-sm">
                    {formatINR(lineTotal)}
                  </span>
                </div>
              </div>

              {/* Out of Stock Warning */}
              {isOutOfStock && (
                <div
                  role="alert"
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Out of stock. Remove this item to continue.</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
