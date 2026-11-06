import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowLeft,
  Wrench,
} from 'lucide-react'
import useCartStore, {
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_FEE,
} from '../../store/cartStore.js'
import CartItem from '../../components/cart/CartItem.jsx'

export default function Cart() {
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const getCartItemsWithDetails = useCartStore(
    (state) => state.getCartItemsWithDetails
  )
  const getSubtotal = useCartStore((state) => state.getSubtotal)
  const getTotalMrp = useCartStore((state) => state.getTotalMrp)
  const getTotalDiscount = useCartStore((state) => state.getTotalDiscount)
  const getDeliveryFee = useCartStore((state) => state.getDeliveryFee)
  const getGrandTotal = useCartStore((state) => state.getGrandTotal)
  const getTotalCount = useCartStore((state) => state.getTotalCount)

  const [isConfirmingClear, setIsConfirmingClear] = useState(false)

  const cartItems = getCartItemsWithDetails()
  const totalCount = getTotalCount()
  const subtotal = getSubtotal()
  const totalMrp = getTotalMrp()
  const totalDiscount = getTotalDiscount()
  const deliveryFee = getDeliveryFee()
  const grandTotal = getGrandTotal()

  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD
  const amountNeededForFreeDelivery = Math.max(
    0,
    FREE_DELIVERY_THRESHOLD - subtotal
  )
  const freeDeliveryProgress = Math.min(
    100,
    Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100)
  )

  const handleConfirmClear = () => {
    clearCart()
    setIsConfirmingClear(false)
  }

  // ================= 1. EMPTY CART STATE =================
  if (!cartItems || cartItems.length === 0) {
    return (
      <main className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-zinc-950">
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center relative shadow-[0_0_40px_rgba(249,115,22,0.15)] mb-6"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.2),transparent_70%)] rounded-3xl" />
            <ShoppingCart className="w-12 h-12 sm:w-14 sm:h-14 text-orange-500 relative z-10 stroke-[1.5]" />
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Your Cart is Empty
          </h1>

          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Looks like you haven't added any high-performance components or
            spare parts yet. Explore our catalog to equip your motorcycle with
            championship-grade hardware.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black font-extrabold text-sm uppercase tracking-wider shadow-[0_0_24px_rgba(249,115,22,0.35)] transition-all cursor-pointer"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-sm uppercase tracking-wider border border-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Quick Categories Bar */}
          <div className="mt-12 pt-8 border-t border-zinc-900">
            <p className="text-xs uppercase font-bold tracking-widest text-zinc-500 mb-3">
              Popular Categories
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { name: 'Headlights', id: 'headlight' },
                { name: 'Braking Systems', id: 'brakes' },
                { name: 'Exhaust Systems', id: 'exhaust' },
                { name: 'Clutch & Gearbox', id: 'clutch' },
              ].map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900/60 hover:bg-orange-500/10 border border-zinc-800 hover:border-orange-500/40 text-xs font-semibold text-zinc-400 hover:text-orange-400 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ================= 2. ACTIVE CART LAYOUT =================
  return (
    <main className="min-h-screen bg-zinc-950 text-white py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-6">
          <Link to="/" className="hover:text-orange-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-orange-400 transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="text-orange-500 font-bold">Cart</span>
        </div>

        {/* Page Heading & Clear Cart Action */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-800/80 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-black uppercase tracking-[0.2em] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Flipkart-Grade Secure Cart</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Shopping Cart{' '}
              <span className="text-zinc-500 font-normal text-xl sm:text-2xl">
                ({totalCount} {totalCount === 1 ? 'item' : 'items'})
              </span>
            </h1>
          </div>

          {/* Inline Clear Cart Confirmation or Trigger */}
          <div className="shrink-0">
            {isConfirmingClear ? (
              <div className="inline-flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900 border border-rose-500/40 animate-in fade-in duration-200">
                <span className="text-xs text-rose-300 font-medium pl-2">
                  Clear all items?
                </span>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Yes, Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cart</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= MAIN 2-COLUMN GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* ================= LEFT COLUMN: ITEM LIST ================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Free Delivery Banner / Progress Bar */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/90 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-200">
                    {isFreeDelivery ? (
                      <span className="text-emerald-400 font-bold">
                        You have unlocked FREE Delivery!
                      </span>
                    ) : (
                      <>
                        Add{' '}
                        <span className="text-orange-400 font-bold">
                          ₹{amountNeededForFreeDelivery.toLocaleString('en-IN')}
                        </span>{' '}
                        more to qualify for FREE Delivery
                      </>
                    )}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-zinc-400">
                  {freeDeliveryProgress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isFreeDelivery
                      ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${freeDeliveryProgress}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {cartItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Continue Shopping Link */}
            <div className="pt-4 flex items-center justify-between">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400 hover:text-orange-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: FLIPKART-STYLE PRICE SUMMARY ================= */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-4">
            <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 shadow-xl backdrop-blur-md">
              {/* Header */}
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 pb-3 border-b border-zinc-800">
                Price Details
              </h2>

              {/* Price Breakdown */}
              <div className="mt-4 space-y-3.5 text-sm">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Price ({totalCount} items)</span>
                  <span className="font-semibold text-white">
                    ₹{totalMrp.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-300">
                  <span>Discount</span>
                  <span className="font-bold text-emerald-400">
                    {totalDiscount > 0
                      ? `- ₹${totalDiscount.toLocaleString('en-IN')}`
                      : '₹0'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-300">
                  <span>Delivery Charges</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
                        <span className="line-through text-zinc-500 font-normal text-xs">
                          ₹{STANDARD_DELIVERY_FEE}
                        </span>
                        FREE
                      </span>
                    ) : (
                      <span className="font-semibold text-white">
                        ₹{deliveryFee}
                      </span>
                    )}
                  </span>
                </div>

                {/* Total Row */}
                <div className="pt-4 border-t border-zinc-800 flex items-baseline justify-between">
                  <span className="text-base font-extrabold text-white">
                    Total Amount
                  </span>
                  <span className="text-2xl font-black text-orange-500 tracking-tight">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Savings Alert Banner */}
              {totalDiscount > 0 && (
                <div className="mt-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    You will save ₹{totalDiscount.toLocaleString('en-IN')} on this
                    order
                  </span>
                </div>
              )}

              {/* Primary Checkout CTA */}
              <div className="mt-6">
                <Link
                  to="/checkout"
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(249,115,22,0.35)] hover:shadow-[0_0_32px_rgba(249,115,22,0.55)] transition-all cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>

              {/* Trust & Guarantee Badges */}
              <div className="mt-6 pt-5 border-t border-zinc-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>100% Genuine Motorcycle Spare Parts</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <RotateCcw className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>7-Day Replacement Guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Lock className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Bank-Grade 256-Bit SSL Encrypted Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
