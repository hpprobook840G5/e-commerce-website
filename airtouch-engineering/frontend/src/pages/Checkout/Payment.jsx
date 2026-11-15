import { useState, useMemo, useId, useRef } from 'react'
import {
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from 'react-router-dom'
import {
  ArrowLeft,
  MessageSquare,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  ChevronRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { useCartStore } from '../../store/cartStore.js'
import { useDirectCheckoutStore } from '../../store/directCheckoutStore.js'
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx'
import { getProductById } from '../../data/products.js'
import CheckoutStepIndicator from '../../components/checkout/CheckoutStepIndicator.jsx'
import PriceDetailsPanel from '../../components/checkout/PriceDetailsPanel.jsx'
import {
  calculatePriceSummary,
  formatINR,
} from '../../components/checkout/priceSummary.js'
import { createCustomerOrder } from '../../services/orderApi.js'

export default function Payment() {
  const navigate = useNavigate()
  const location = useLocation()
  const isDirectMode = useMemo(() => {
    return new URLSearchParams(location.search).get('mode') === 'direct'
  }, [location.search])

  const { items: cartRawItems, clearCart } = useCartStore()
  const { items: directRawItems, clearDirectItems } = useDirectCheckoutStore()
  const activeRawItems = isDirectMode ? directRawItems : cartRawItems
  const { user } = useCustomerAuth()
  const orderPlacedRef = useRef(false)

  // Generate an idempotency key once for this payment page visit
  const [idempotencyKey] = useState(() => {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `key-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  })

  // Selected address from router state or user profile fallback
  const address = useMemo(() => {
    if (location.state?.address) {
      return location.state.address
    }
    if (user && user.addressLine1) {
      return {
        fullName: user.fullName || 'Valued Customer',
        mobile: user.mobile || '',
        line1: user.addressLine1,
        addressLine1: user.addressLine1,
        landmark: user.landmark || '',
        district: user.district || '',
        state: user.state || '',
        pincode: user.pincode || '',
        country: user.country || 'India',
      }
    }
    return null
  }, [location.state, user])

  // Hydrate cart items
  const { detailedItems, hasOutOfStock } = useMemo(() => {
    const raw = activeRawItems || []
    const detailed = []
    let outOfStock = false

    for (const item of raw) {
      const id = item.productId || item.id
      const product = getProductById(id)
      if (!product) continue

      const qty = Math.max(1, Number(item.quantity) || 1)
      if (typeof product.stock === 'number' && product.stock <= 0) {
        outOfStock = true
      }

      detailed.push({
        ...product,
        productId: product.id,
        quantity: qty,
      })
    }

    return { detailedItems: detailed, hasOutOfStock: outOfStock }
  }, [activeRawItems])

  // Dynamic price summary
  const priceSummary = useMemo(() => {
    return calculatePriceSummary(detailedItems)
  }, [detailedItems])

  // Payment Options State
  // mainOption: 'request' | 'pay_now'
  const [mainOption, setMainOption] = useState('request')
  // subOption: 'cod' | 'upi'
  const [subOption, setSubOption] = useState('upi')

  // Form Submission State
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [priceChangeTotal, setPriceChangeTotal] = useState(null)
  const [unavailableItems, setUnavailableItems] = useState([])

  // Effective order type
  const effectiveOrderType = mainOption === 'request' ? 'request' : subOption

  // Form label IDs
  const legendId = useId()

  // Guard 1: Redirect empty cart to /cart (skip if order was just placed)
  if (!orderPlacedRef.current && (!activeRawItems || activeRawItems.length === 0)) {
    return <Navigate to="/cart" replace />
  }

  // Guard 2: Redirect missing address to /checkout
  if (!orderPlacedRef.current && !address) {
    return <Navigate to={isDirectMode ? '/checkout?step=address&mode=direct' : '/checkout?step=address'} replace />
  }

  const getButtonText = () => {
    if (submitting) return 'Processing Order...'
    if (mainOption === 'request') return 'Request Order'
    if (subOption === 'cod') return 'Place Order (COD)'
    return `Pay ${formatINR(priceSummary.total)} via UPI`
  }

  const handleSubmitOrder = async () => {
    if (submitting || hasOutOfStock) return

    setSubmitting(true)
    setServerError(null)
    setPriceChangeTotal(null)
    setUnavailableItems([])

    const payload = {
      orderType: effectiveOrderType,
      items: detailedItems.map((item) => ({
        productId: item.productId || item.id,
        quantity: item.quantity,
      })),
      address: {
        fullName: address.fullName,
        mobile: address.mobile,
        addressLine1: address.addressLine1 || address.line1,
        line1: address.addressLine1 || address.line1,
        landmark: address.landmark || undefined,
        state: address.state,
        district: address.district,
        pincode: address.pincode,
      },
      expectedTotal: priceChangeTotal !== null ? priceChangeTotal : priceSummary.total,
      idempotencyKey,
    }

    try {
      const result = await createCustomerOrder(payload)
      orderPlacedRef.current = true

      // Enrich order object passed in router state so OrderResult has immediate access to
      // customer name, shipping address snapshot, and full items manifest
      const enrichedOrder = {
        ...result,
        customerName: address.fullName || user?.fullName || '',
        customerMobile: address.mobile || user?.mobile || '',
        customerEmail: user?.email || '',
        shippingAddress: {
          fullName: address.fullName || user?.fullName || '',
          mobile: address.mobile || user?.mobile || '',
          line1: address.addressLine1 || address.line1 || '',
          landmark: address.landmark || null,
          district: address.district || '',
          state: address.state || '',
          pincode: address.pincode || '',
          country: 'India',
        },
        items: detailedItems.map((item) => ({
          id: item.productId || item.id,
          productId: item.productId || item.id,
          productName: item.name,
          category: item.category || 'General',
          unitPrice: item.price,
          quantity: item.quantity,
          lineTotal: item.price * item.quantity,
        })),
      }

      navigate(`/order/${result.orderNumber}`, {
        state: { order: enrichedOrder },
        replace: true,
      })
      if (isDirectMode) {
        clearDirectItems()
      } else {
        clearCart()
      }
    } catch (err) {
      orderPlacedRef.current = false
      if (err.code === 'PRICE_CHANGED') {
        setPriceChangeTotal(err.total)
        setServerError(`Prices changed. Your total is now ${formatINR(err.total)}.`)
      } else if (err.code === 'ITEM_UNAVAILABLE') {
        setUnavailableItems(err.items || [])
        setServerError('Some items in your cart are no longer available.')
      } else if (err.status === 503) {
        setServerError('UPI is not available right now. Please choose another option.')
      } else {
        setServerError(err.message || 'Unable to place order. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-28 lg:pb-16 selection:bg-orange-500 selection:text-black">
      {/* Hide floating WhatsApp button on payment page */}
      <style>{`
        a[aria-label="Chat with AirTouch Engineering on WhatsApp"] {
          display: none !important;
        }
      `}</style>

      {/* Header Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={isDirectMode ? '/checkout?step=confirm&mode=direct' : '/checkout?step=confirm'}
              className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="Back to order confirmation"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base sm:text-xl font-black uppercase tracking-wider text-white">
              Checkout
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Direct Admin Verification</span>
          </div>
        </div>
      </header>

      {/* Step Indicator with Payment active (step 3) */}
      <div className="border-b border-zinc-900 bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CheckoutStepIndicator currentStep="payment" />
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Direct Checkout Banner */}
        {isDirectMode && (
          <div
            role="status"
            className="mb-6 p-3.5 sm:p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs sm:text-sm text-zinc-300 flex items-center justify-between gap-3 shadow-md"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Zap className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="truncate sm:whitespace-normal">
                Buying now: <strong className="text-white font-semibold">{detailedItems[0]?.name || 'Selected product'}</strong> only. Your cart is unchanged.
              </span>
            </div>
            <Link
              to="/cart"
              onClick={() => clearDirectItems()}
              className="text-orange-400 hover:text-orange-300 font-bold whitespace-nowrap underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded shrink-0"
            >
              Back to cart
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ================= LEFT COLUMN (~60%): PAYMENT OPTIONS ================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <section aria-labelledby={legendId} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2
                  id={legendId}
                  className="text-base sm:text-lg font-bold text-white tracking-wide"
                >
                  Payment &amp; Order Method
                </h2>
              </div>

              {/* Error Banners */}
              {serverError && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-red-950/40 border border-red-800 text-red-200 text-xs sm:text-sm space-y-2.5 shadow-lg"
                >
                  <div className="flex items-center gap-2 font-bold text-red-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{serverError}</span>
                  </div>

                  {priceChangeTotal !== null && (
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSubmitOrder}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Accept Total &amp; Proceed ({formatINR(priceChangeTotal)})</span>
                      </button>
                    </div>
                  )}

                  {unavailableItems.length > 0 && (
                    <div className="pt-1 text-xs text-red-300">
                      <p className="font-semibold mb-1">Unavailable components:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-red-300/90">
                        {unavailableItems.map((name, i) => (
                          <li key={i}>{name}</li>
                        ))}
                      </ul>
                      <div className="pt-2">
                        <Link
                          to="/cart"
                          className="inline-block text-xs font-bold text-orange-400 hover:text-orange-300 underline"
                        >
                          Return to cart to adjust items
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fieldset 1: Main Order Procedure */}
              <fieldset className="space-y-3">
                <legend className="sr-only">How would you like to proceed?</legend>

                {/* Option 1: Request Order */}
                <label
                  className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                    mainOption === 'request'
                      ? 'bg-orange-500/5 border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/50'
                      : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="main-order-option"
                    value="request"
                    checked={mainOption === 'request'}
                    onChange={() => {
                      setMainOption('request')
                      setServerError(null)
                    }}
                    className="mt-1 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-950"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-white text-sm sm:text-base">
                        Request Order
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
                      Talk to us first. We&apos;ll confirm part availability, compatibility, and payment details directly with you on WhatsApp or call.
                    </p>
                  </div>
                </label>

                {/* Option 2: Pay Now */}
                <label
                  className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                    mainOption === 'pay_now'
                      ? 'bg-orange-500/5 border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/50'
                      : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="main-order-option"
                    value="pay_now"
                    checked={mainOption === 'pay_now'}
                    onChange={() => {
                      setMainOption('pay_now')
                      setServerError(null)
                    }}
                    className="mt-1 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-950"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-white text-sm sm:text-base">
                        Pay Now
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
                      Instant direct payment via UPI QR code or choose Cash on Delivery.
                    </p>
                  </div>
                </label>
              </fieldset>

              {/* Sub-choice for "Pay now": Revealed when mainOption === 'pay_now' */}
              {mainOption === 'pay_now' && (
                <div className="p-4 sm:p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3.5 shadow-xl transition-all">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800">
                    Select Payment Option
                  </h3>

                  <fieldset className="space-y-3">
                    <legend className="sr-only">Choose a pay-now method</legend>

                    {/* Sub-Option 1: UPI */}
                    <label
                      className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                        subOption === 'upi'
                          ? 'bg-orange-500/5 border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pay-now-sub-option"
                        value="upi"
                        checked={subOption === 'upi'}
                        onChange={() => setSubOption('upi')}
                        className="mt-1 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-950"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-orange-400" />
                          <span className="font-bold text-white text-xs sm:text-sm">
                            Pay via UPI
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                            Instant QR
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                          Scan with Google Pay, PhonePe, Paytm, or BHIM. Zero convenience fees.
                        </p>
                      </div>
                    </label>

                    {/* Sub-Option 2: COD */}
                    <label
                      className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                        subOption === 'cod'
                          ? 'bg-orange-500/5 border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pay-now-sub-option"
                        value="cod"
                        checked={subOption === 'cod'}
                        onChange={() => setSubOption('cod')}
                        className="mt-1 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-950"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-zinc-300" />
                          <span className="font-bold text-white text-xs sm:text-sm">
                            Cash on Delivery (COD)
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                          Pay cash upon delivery. Our logistics team will call to confirm before dispatch.
                        </p>
                      </div>
                    </label>
                  </fieldset>
                </div>
              )}

              {/* Delivery Address Summary Review Card */}
              <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3.5 sm:p-4 flex items-center justify-between text-xs">
                <div className="text-zinc-400 truncate">
                  <span className="font-bold text-white mr-1.5">Shipping to:</span>
                  <span>{address.fullName}</span>,{' '}
                  <span className="text-zinc-500">
                    {address.addressLine1 || address.line1}, {address.district} - {address.pincode}
                  </span>
                </div>
                <Link
                  to={isDirectMode ? '/checkout?step=address&mode=direct' : '/checkout?step=address'}
                  className="text-xs font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider shrink-0 transition-colors ml-2"
                >
                  Change
                </Link>
              </div>

              {/* Desktop Submit Button */}
              <div className="hidden lg:block pt-3">
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={submitting || hasOutOfStock}
                  className={`w-full py-4 px-6 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    submitting || hasOutOfStock
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black shadow-[0_0_24px_rgba(249,115,22,0.35)] hover:shadow-[0_0_32px_rgba(249,115,22,0.55)] cursor-pointer'
                  }`}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                  <span>{getButtonText()}</span>
                  {!submitting && <ChevronRight className="w-4 h-4 stroke-[2.5]" />}
                </button>
              </div>
            </section>
          </div>

          {/* ================= RIGHT COLUMN (~40%): STICKY PRICE DETAILS ================= */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-20 sm:top-24 space-y-4">
            <PriceDetailsPanel
              summary={priceSummary}
              showPrimaryCta={false}
            />
          </div>
        </div>
      </main>

      {/* ================= MOBILE STICKY BOTTOM BAR (<lg) ================= */}
      <aside
        aria-label="Checkout action bar"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 border-t border-zinc-800 backdrop-blur-md px-4 py-3 shadow-[0_-10px_25px_rgba(0,0,0,0.6)]"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Total & Savings */}
          <div className="min-w-0 space-y-0.5">
            {priceSummary.savings > 0 && (
              <div className="text-[11px] font-bold text-emerald-400 truncate">
                You&apos;ll save {formatINR(priceSummary.savings)}
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-black font-mono text-white">
                {formatINR(priceSummary.total)}
              </span>
              {priceSummary.mrpTotal > priceSummary.sellingTotal && (
                <span className="text-xs text-zinc-500 line-through font-mono">
                  {formatINR(priceSummary.mrpTotal)}
                </span>
              )}
            </div>
          </div>

          {/* Right: Primary Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={submitting || hasOutOfStock}
              className={`py-3 px-5 sm:px-6 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                submitting || hasOutOfStock
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.35)] cursor-pointer'
              }`}
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />}
              <span>{getButtonText()}</span>
              {!submitting && <ChevronRight className="w-4 h-4 stroke-[2.5]" />}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
