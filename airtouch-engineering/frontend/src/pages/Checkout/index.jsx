import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
  Navigate,
} from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useCartStore } from '../../store/cartStore.js'
import { useDirectCheckoutStore } from '../../store/directCheckoutStore.js'
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx'
import { getProductById } from '../../data/products.js'
import CheckoutStepIndicator from '../../components/checkout/CheckoutStepIndicator.jsx'
import AddressCard from '../../components/checkout/AddressCard.jsx'
import AddressForm from '../../components/checkout/AddressForm.jsx'
import ConfirmProductList from '../../components/checkout/ConfirmProductList.jsx'
import PriceDetailsPanel from '../../components/checkout/PriceDetailsPanel.jsx'
import {
  calculatePriceSummary,
  formatINR,
} from '../../components/checkout/priceSummary.js'

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const rawStep = searchParams.get('step')
  // Step fallback: only 'address' and 'confirm' are handled here; default is 'address'
  const currentStep = rawStep === 'confirm' ? 'confirm' : 'address'
  const isDirectMode = searchParams.get('mode') === 'direct'

  const { items: cartRawItems } = useCartStore()
  const { items: directRawItems, clearDirectItems } = useDirectCheckoutStore()
  const activeRawItems = isDirectMode ? directRawItems : cartRawItems
  const { user } = useCustomerAuth()
  const orderPlacedRef = useRef(false)

  // Hydrate cart items from local product catalog
  const { detailedItems, skippedCount, hasOutOfStock } = useMemo(() => {
    const raw = activeRawItems || []
    const detailed = []
    let skipped = 0
    let outOfStock = false

    for (const item of raw) {
      const id = item.productId || item.id
      const product = getProductById(id)
      if (!product) {
        skipped += 1
        continue
      }

      const qty = Math.max(1, Number(item.quantity) || 1)
      const isOos = typeof product.stock === 'number' && product.stock <= 0
      if (isOos) outOfStock = true

      detailed.push({
        ...product,
        productId: product.id,
        quantity: qty,
      })
    }

    return {
      detailedItems: detailed,
      skippedCount: skipped,
      hasOutOfStock: outOfStock,
    }
  }, [activeRawItems])

  // Price calculation
  const priceSummary = useMemo(() => {
    return calculatePriceSummary(detailedItems)
  }, [detailedItems])

  // Initialize saved addresses from customer profile
  const [addresses, setAddresses] = useState(() => {
    const list = []
    if (user && user.addressLine1) {
      list.push({
        id: 'profile-default',
        fullName: user.fullName || 'Valued Customer',
        mobile: user.mobile || '',
        addressLine1: user.addressLine1 || '',
        landmark: user.landmark || '',
        district: user.district || '',
        state: user.state || '',
        pincode: user.pincode || '',
        country: user.country || 'India',
        isDefault: true,
        isSessionOnly: false,
      })
    }
    return list
  })

  // Selected address state
  const initialAddressId = location.state?.selectedAddressId || (addresses[0]?.id ?? null)
  const [selectedAddressId, setSelectedAddressId] = useState(initialAddressId)

  // Mode states for Address Step
  const [isChangingAddress, setIsChangingAddress] = useState(false)
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false)

  // Sync default selection if addresses array was initialized later
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      setSelectedAddressId(addresses[0].id)
    }
  }, [addresses, selectedAddressId])

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId) || addresses[0] || null
  }, [addresses, selectedAddressId])

  // Handlers for address step
  const handleSaveNewAddress = (newAddrData) => {
    const newAddress = {
      id: `session-addr-${Date.now()}`,
      ...newAddrData,
      isDefault: addresses.length === 0,
      isSessionOnly: true,
    }

    setAddresses((prev) => [newAddress, ...prev])
    setSelectedAddressId(newAddress.id)
    setIsAddingNewAddress(false)
    setIsChangingAddress(false)
  }

  const handleContinueToConfirm = () => {
    if (!selectedAddress) return
    setIsChangingAddress(false)
    setIsAddingNewAddress(false)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('step', 'confirm')
    setSearchParams(nextParams)
  }

  const handleContinueToPayment = () => {
    if (hasOutOfStock || !selectedAddress) return
    navigate(isDirectMode ? '/checkout/payment?mode=direct' : '/checkout/payment', {
      state: {
        addressId: selectedAddress.id,
        selectedAddressId: selectedAddress.id,
        address: selectedAddress,
      },
    })
  }

  const handleBack = () => {
    if (currentStep === 'confirm') {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('step', 'address')
      setSearchParams(nextParams)
    } else {
      if (isDirectMode) clearDirectItems()
      navigate('/cart')
    }
  }

  // Guard: Redirect empty cart to /cart before render (skip if order was just placed)
  if (!orderPlacedRef.current && (!activeRawItems || activeRawItems.length === 0)) {
    return <Navigate to="/cart" replace />
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-28 lg:pb-16 selection:bg-orange-500 selection:text-black">
      {/* Hide floating WhatsApp button on checkout so it doesn't overlap sticky mobile bar or CTAs */}
      <style>{`
        a[aria-label="Chat with AirTouch Engineering on WhatsApp"] {
          display: none !important;
        }
      `}</style>

      {/* Checkout Header Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label={currentStep === 'confirm' ? 'Back to delivery address' : 'Back to cart'}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-xl font-black uppercase tracking-wider text-white">
              Checkout
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Progress Step Indicator */}
      <div className="border-b border-zinc-900 bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CheckoutStepIndicator currentStep={currentStep} />
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
          {/* ================= LEFT COLUMN (~60%) ================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* ================= STEP 1: ADDRESS STEP ================= */}
            {currentStep === 'address' && (
              <section aria-labelledby="address-heading" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2
                    id="address-heading"
                    className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2"
                  >
                    <span>Delivering to</span>
                  </h2>
                </div>

                {/* If user has no saved addresses, show AddressForm directly */}
                {addresses.length === 0 ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Please enter your delivery address to proceed with your order.</span>
                    </div>
                    <AddressForm
                      initialValues={{
                        fullName: user?.fullName || '',
                        mobile: user?.mobile || '',
                      }}
                      onSave={handleSaveNewAddress}
                      showCancel={false}
                    />
                  </div>
                ) : isAddingNewAddress ? (
                  /* Form to add another address */
                  <AddressForm
                    initialValues={{
                      fullName: user?.fullName || '',
                      mobile: user?.mobile || '',
                    }}
                    onSave={handleSaveNewAddress}
                    onCancel={() => setIsAddingNewAddress(false)}
                    showCancel={true}
                  />
                ) : isChangingAddress ? (
                  /* Radio group list of all saved addresses */
                  <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4 sm:p-6 space-y-4 shadow-xl">
                    <fieldset className="space-y-3">
                      <legend className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800 w-full">
                        Choose a delivery address
                      </legend>

                      <div className="space-y-3 pt-2">
                        {addresses.map((addr) => {
                          const isSelected = addr.id === selectedAddressId
                          return (
                            <label
                              key={addr.id}
                              className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-orange-500/5 border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                                  : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name="delivery-address"
                                value={addr.id}
                                checked={isSelected}
                                onChange={() => setSelectedAddressId(addr.id)}
                                className="mt-1 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-950"
                              />

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-white text-xs sm:text-sm">
                                    {addr.fullName}
                                  </span>
                                  {addr.isDefault && (
                                    <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
                                      Default
                                    </span>
                                  )}
                                  {addr.isSessionOnly && (
                                    <span className="text-[10px] font-semibold bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30">
                                      Session only
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-zinc-400 leading-relaxed">
                                  {addr.addressLine1}
                                  {addr.landmark ? `, near ${addr.landmark}` : ''}, {addr.district},{' '}
                                  {addr.state} -{' '}
                                  <span className="font-mono text-zinc-200">{addr.pincode}</span>
                                </p>

                                <p className="text-xs text-zinc-400 font-mono">
                                  Mobile: {addr.mobile}
                                </p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </fieldset>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80">
                      <button
                        type="button"
                        onClick={() => setIsAddingNewAddress(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 hover:text-orange-300 transition-colors py-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add new address</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsChangingAddress(false)}
                          className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard view: Selected Address Card */
                  <AddressCard
                    address={selectedAddress}
                    onChangeClick={() => setIsChangingAddress(true)}
                  />
                )}

                {/* Continue button for Address Step (Desktop view) */}
                <div className="pt-2 hidden lg:block">
                  <button
                    type="button"
                    onClick={handleContinueToConfirm}
                    disabled={!selectedAddress}
                    className={`w-full py-4 px-6 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      !selectedAddress
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black shadow-[0_0_24px_rgba(249,115,22,0.35)] hover:shadow-[0_0_32px_rgba(249,115,22,0.55)] cursor-pointer'
                    }`}
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  {!selectedAddress && (
                    <p className="text-xs text-amber-400 text-center mt-2" role="status">
                      Select a delivery address to continue.
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* ================= STEP 2: CONFIRM DETAILS STEP ================= */}
            {currentStep === 'confirm' && (
              <section aria-labelledby="confirm-heading" className="space-y-6">
                {/* Compact Delivering To Header */}
                <div className="space-y-1.5">
                  <h2 id="confirm-heading" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Delivery Address
                  </h2>
                  <AddressCard
                    address={selectedAddress}
                    compact={true}
                    onChangeClick={() => {
                      const nextParams = new URLSearchParams(searchParams)
                      nextParams.set('step', 'address')
                      setSearchParams(nextParams)
                      setIsChangingAddress(true)
                    }}
                  />
                </div>

                {/* Order Summary & Products list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                      Order Summary ({detailedItems.length}{' '}
                      {detailedItems.length === 1 ? 'item' : 'items'})
                    </h2>
                  </div>

                  <ConfirmProductList
                    items={detailedItems}
                    skippedCount={skippedCount}
                  />
                </div>
              </section>
            )}
          </div>

          {/* ================= RIGHT COLUMN (~40%): STICKY PRICE DETAILS ================= */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-20 sm:top-24 space-y-4">
            <PriceDetailsPanel
              summary={priceSummary}
              showPrimaryCta={true}
              ctaText={currentStep === 'address' ? 'Continue' : 'Continue to Payment'}
              onCtaClick={
                currentStep === 'address'
                  ? handleContinueToConfirm
                  : handleContinueToPayment
              }
              ctaDisabled={
                currentStep === 'address'
                  ? !selectedAddress
                  : !selectedAddress || hasOutOfStock
              }
              ctaDisabledReason={
                currentStep === 'address'
                  ? !selectedAddress
                    ? 'Select a delivery address to continue.'
                    : ''
                  : hasOutOfStock
                  ? 'Out of stock items present. Remove them to continue.'
                  : !selectedAddress
                  ? 'Delivery address missing.'
                  : ''
              }
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

          {/* Right: Orange Primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={
                currentStep === 'address'
                  ? handleContinueToConfirm
                  : handleContinueToPayment
              }
              disabled={
                currentStep === 'address'
                  ? !selectedAddress
                  : !selectedAddress || hasOutOfStock
              }
              className={`py-3 px-5 sm:px-6 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                (currentStep === 'address' && !selectedAddress) ||
                (currentStep === 'confirm' && (hasOutOfStock || !selectedAddress))
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.35)] cursor-pointer'
              }`}
            >
              <span>{currentStep === 'address' ? 'Continue' : 'Continue'}</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Mobile error reason below bar if disabled */}
        {((currentStep === 'address' && !selectedAddress) ||
          (currentStep === 'confirm' && hasOutOfStock)) && (
          <p className="text-[11px] text-red-400 text-center mt-1" role="status">
            {currentStep === 'address'
              ? 'Select a delivery address to continue.'
              : 'Out of stock. Remove this item to continue.'}
          </p>
        )}
      </aside>
    </div>
  )
}
