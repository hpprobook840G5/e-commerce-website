import { useState, useEffect } from 'react'
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  Package,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Check,
  FileText,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { CONTACT_INFO } from '../../config/contactInfo.js'
import { formatINR } from '../../components/checkout/priceSummary.js'
import {
  fetchCustomerOrderByNumber,
  submitCustomerUpiReference,
  downloadOrderInvoice,
} from '../../services/orderApi.js'
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx'

export default function OrderResult() {
  const { orderNumber } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useCustomerAuth()

  const [order, setOrder] = useState(location.state?.order || null)
  const [loading, setLoading] = useState(!location.state?.order)
  const [fetchError, setFetchError] = useState(null)

  // UPI Reference state
  const [referenceInput, setReferenceInput] = useState('')
  const [submittingRef, setSubmittingRef] = useState(false)
  const [refSuccess, setRefSuccess] = useState(false)
  const [refError, setRefError] = useState(null)

  // Invoice download state
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)
  const [invoiceError, setInvoiceError] = useState(null)

  const handleDownloadInvoice = async () => {
    if (!orderNumber || downloadingInvoice) return
    setDownloadingInvoice(true)
    setInvoiceError(null)
    try {
      const blob = await downloadOrderInvoice(orderNumber)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${orderNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[OrderResult] Invoice download error:', err)
      setInvoiceError(err.message || 'Unable to download invoice. Please try again.')
    } finally {
      setDownloadingInvoice(false)
    }
  }

  // Handle browser back button: navigate to /products instead of /cart or /checkout
  useEffect(() => {
    const handlePopState = () => {
      navigate('/products', { replace: true })
    }

    // Push state so pressing browser back triggers popstate on this route
    window.history.pushState({ orderResult: true }, '', window.location.href)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [navigate])

  useEffect(() => {
    let mounted = true
    const hasCompleteData =
      order &&
      order.customerName &&
      order.shippingAddress &&
      order.items &&
      order.items.length > 0

    if (!hasCompleteData && orderNumber) {
      if (!order) setLoading(true)
      fetchCustomerOrderByNumber(orderNumber)
        .then((data) => {
          if (mounted) {
            setOrder(data)
            if (data.upiReference) {
              setReferenceInput(data.upiReference)
              setRefSuccess(true)
            }
            setLoading(false)
          }
        })
        .catch((err) => {
          if (mounted) {
            if (!order) {
              setFetchError(err.message || 'Unable to retrieve order details.')
            }
            setLoading(false)
          }
        })
    } else if (order?.upiReference) {
      setReferenceInput(order.upiReference)
      setRefSuccess(true)
    }

    return () => {
      mounted = false
    }
  }, [orderNumber, order])

  // Handle UPI Reference Submission
  const handleSubmitReference = async (e) => {
    e.preventDefault()
    const clean = referenceInput.trim()
    if (!clean || clean.length < 6 || clean.length > 40) {
      setRefError('Please enter a valid transaction reference (6-40 alphanumeric characters).')
      return
    }

    setSubmittingRef(true)
    setRefError(null)

    try {
      await submitCustomerUpiReference(orderNumber, clean)
      setRefSuccess(true)
    } catch (err) {
      setRefError(err.message || 'Failed to submit transaction reference.')
    } finally {
      setSubmittingRef(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 p-6">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
        <span className="text-xs font-mono uppercase tracking-widest">
          Loading order details...
        </span>
      </div>
    )
  }

  if (fetchError || !order) {
    return (
      <div className="min-h-[70vh] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-red-500/10 text-red-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-white mb-2">Order not found</h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6">
          {fetchError || 'We could not find this order or you may not have permission to view it.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/orders"
            className="px-5 py-2.5 rounded-xl bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-700 border border-zinc-700 transition-colors"
          >
            My Orders
          </Link>
          <Link
            to="/products"
            className="px-5 py-2.5 rounded-xl bg-orange-500 text-black text-xs font-bold uppercase tracking-wider hover:bg-orange-400 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  const {
    orderType = 'request',
    status = 'pending',
    totals = {},
    upi,
    items = [],
  } = order

  const grandTotal = totals.total || 0
  const rawWaEnv = import.meta.env.VITE_WHATSAPP_NUMBER || ''
  const whatsappNum = rawWaEnv.replace(/\D/g, '') || (CONTACT_INFO.whatsapp?.number ? CONTACT_INFO.whatsapp.number.replace(/\D/g, '') : '')
  const hasValidWaNum = Boolean(whatsappNum && whatsappNum.length >= 10)
  const phoneDial = CONTACT_INFO.phone?.dial
  const phoneDisplay = CONTACT_INFO.phone?.display

  // Build WhatsApp prefilled link from server order data
  const buildWhatsAppMessage = (orderData) => {
    const orderNo = orderData?.orderNumber || orderNumber || ''

    // 1. Customer Name: order response -> shippingAddress.fullName -> user.fullName -> ''
    const customer =
      orderData?.customerName?.trim() ||
      orderData?.shippingAddress?.fullName?.trim() ||
      user?.fullName?.trim() ||
      ''

    // 2. Delivery Area: district, state - pincode
    const addr = orderData?.shippingAddress || {}
    const district = addr.district || addr.city || ''
    const state = addr.state || ''
    const pincode = addr.pincode || ''

    let deliveryArea = ''
    if (district && state) {
      deliveryArea = `${district}, ${state}${pincode ? ` - ${pincode}` : ''}`
    } else if (state) {
      deliveryArea = `${state}${pincode ? ` - ${pincode}` : ''}`
    } else if (district) {
      deliveryArea = `${district}${pincode ? ` - ${pincode}` : ''}`
    } else if (addr.line1 || addr.addressLine1) {
      deliveryArea = `${addr.line1 || addr.addressLine1}${pincode ? ` - ${pincode}` : ''}`
    } else {
      deliveryArea = pincode || 'India'
    }

    // 3. Items list: 1. {product name} x {qty} - ₹{line total}
    const orderItems = orderData?.items || []
    const MAX_DISPLAY_ITEMS = 8
    const displayedItems = orderItems.slice(0, MAX_DISPLAY_ITEMS)
    const extraCount = orderItems.length - MAX_DISPLAY_ITEMS

    const itemsFormatted = displayedItems.map((it, idx) => {
      const name = it.productName || it.name || 'Product'
      const qty = it.quantity || 1
      const lineTotal =
        it.lineTotal !== undefined
          ? it.lineTotal
          : it.line_total_paise !== undefined
          ? Math.round(Number(it.line_total_paise) / 100)
          : (Number(it.unitPrice || 0) * qty)
      return `${idx + 1}. ${name} x ${qty} - ${formatINR(lineTotal)}`
    })

    if (extraCount > 0) {
      itemsFormatted.push(`+${extraCount} more items`)
    }

    const itemsText = itemsFormatted.length > 0 ? itemsFormatted.join('\n') : '1 item'

    // 4. Total Amount
    const grandTot = orderData?.totals?.total || totals.total || grandTotal || 0
    const totalFormatted = formatINR(grandTot)

    const lines = [
      `Hi AirTouch Engineering, I have placed Request Order ${orderNo}.`,
      `Customer Name: ${customer}`,
      `Delivery Area: ${deliveryArea}`,
      `Items:`,
      itemsText,
      `Total: ${totalFormatted}`,
      `Please confirm parts availability and payment instructions.`,
    ]

    let fullMessage = lines.join('\n')
    // Keep message under about 1500 characters
    if (fullMessage.length > 1500) {
      fullMessage = fullMessage.slice(0, 1490) + '...'
    }

    return fullMessage
  }

  const waUrl = hasValidWaNum && order
    ? `https://wa.me/${whatsappNum}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`
    : null

  // Auto-open WhatsApp once per order for Request orders
  useEffect(() => {
    if (!order || order.orderType !== 'request' || !waUrl) return

    const storageKey = `wa_opened_${order.orderNumber}`
    try {
      const alreadyOpened = sessionStorage.getItem(storageKey)
      if (!alreadyOpened) {
        sessionStorage.setItem(storageKey, 'true')
        window.open(waUrl, '_blank', 'noopener,noreferrer')
      }
    } catch {
      // Ignore sessionStorage exceptions in private browsing
    }
  }, [order, waUrl])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16 selection:bg-orange-500 selection:text-black">
      {/* Hide floating WhatsApp button on order result screen */}
      <style>{`
        a[aria-label="Chat with AirTouch Engineering on WhatsApp"] {
          display: none !important;
        }
      `}</style>

      {/* Header Bar with Back Arrow to /products */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/products', { replace: true })}
              className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              aria-label="Back to products"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-xl font-black uppercase tracking-wider text-white">
              Order Confirmation
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Order Placed Successfully</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ================= 1. SHARED STATUS HEADER CARD ================= */}
        <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>Status: {status}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Order {orderNumber} Received
            </h1>

            <p className="text-sm font-mono text-zinc-400">
              Total Amount:{' '}
              <span className="text-base sm:text-lg font-bold text-white">
                {formatINR(grandTotal)}
              </span>
            </p>

            <div className="pt-3 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 transition-colors cursor-pointer disabled:opacity-50 min-h-[38px] shadow-sm hover:shadow"
              >
                {downloadingInvoice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                    <span>Preparing PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-orange-400" />
                    <span>
                      {(status || '').toLowerCase() === 'completed'
                        ? 'Download invoice'
                        : 'Download invoice (pending)'}
                    </span>
                  </>
                )}
              </button>

              {invoiceError && (
                <p role="alert" className="text-xs text-rose-400 font-medium">
                  {invoiceError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ================= 2. WORKFLOW-SPECIFIC ACTION BLOCK ================= */}

        {/* --- SCENARIO 1: REQUEST ORDER --- */}
        {orderType === 'request' && (
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 sm:p-8 space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Contact us to confirm your order
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Thank you for requesting this order. Please get in touch with our engineering team on WhatsApp or phone to confirm parts availability, bike fitment, and your preferred payment method.
              </p>
            </div>

            {/* Large WhatsApp & Call Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Open WhatsApp</span>
                </a>
              ) : (
                <div className="p-3.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs text-zinc-400 text-center flex items-center justify-center">
                  WhatsApp number not configured. Our team will contact you.
                </div>
              )}

              {phoneDial && (
                <a
                  href={`tel:${phoneDial}`}
                  className="flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider border border-zinc-700 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  <Phone className="w-5 h-5 text-orange-400" />
                  <span>Call {phoneDisplay || phoneDial}</span>
                </a>
              )}
            </div>

            {/* Business Hours & Response Guarantee */}
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-850 text-xs text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-300">
                Operating Hours: {CONTACT_INFO.workingHours.label}
              </p>
              <p className="text-zinc-500">
                {CONTACT_INFO.responseTime}
              </p>
            </div>
          </div>
        )}

        {/* --- SCENARIO 2: CASH ON DELIVERY (COD) --- */}
        {orderType === 'cod' && (
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 sm:p-8 space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Cash on Delivery Confirmed
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Order placed. Our team will call you to confirm delivery. Pay{' '}
                <strong className="text-white font-mono text-sm sm:text-base">
                  {formatINR(grandTotal)}
                </strong>{' '}
                in cash on delivery when your components arrive.
              </p>
            </div>

            {/* Secondary Support Actions */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Questions about your delivery?
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-emerald-400 border border-zinc-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Updates</span>
                  </a>
                )}
                {phoneDial && (
                  <a
                    href={`tel:${phoneDial}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 border border-zinc-700 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-orange-400" />
                    <span>Call Support</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- SCENARIO 3: PAY VIA UPI --- */}
        {orderType === 'upi' && (
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Scan &amp; Pay via UPI
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                Scan the dynamic QR code with any UPI app (GPay, PhonePe, Paytm, BHIM) to transfer the exact amount.
              </p>
            </div>

            {/* QR Code Container with Quiet Zone (White Background) */}
            {upi?.link && (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  <QRCodeSVG
                    value={upi.link}
                    size={220}
                    level="H"
                    includeMargin={true}
                    className="w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]"
                  />
                </div>

                <div className="text-center space-y-1">
                  <div className="text-xl sm:text-2xl font-black font-mono text-orange-400 tracking-tight">
                    {formatINR(grandTotal)}
                  </div>
                  <div className="text-xs font-mono text-zinc-400">
                    Payee: <span className="text-zinc-200">{upi.payeeName}</span> ({upi.vpa})
                  </div>
                </div>

                {/* Mobile Direct Deep-Link Button */}
                <div className="sm:hidden w-full pt-1">
                  <a
                    href={upi.link}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in UPI App</span>
                  </a>
                </div>
              </div>
            )}

            {/* Warning Note */}
            <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 leading-relaxed text-center sm:text-left">
              <strong>Notice:</strong> Pay exactly{' '}
              <strong className="text-white">{formatINR(grandTotal)}</strong>. Your order is confirmed once we verify the payment.
            </div>

            {/* Optional Customer Transaction Reference Submission */}
            <form
              onSubmit={handleSubmitReference}
              className="p-4 sm:p-5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3"
            >
              <div className="space-y-1">
                <label
                  htmlFor="upi-reference-input"
                  className="block text-xs font-bold text-zinc-300 uppercase tracking-wider"
                >
                  UPI Transaction ID (Optional)
                </label>
                <p className="text-[11px] text-zinc-500">
                  Enter the 12-digit UTR or transaction ID from your UPI app receipt to help us verify your payment faster.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <input
                  id="upi-reference-input"
                  type="text"
                  maxLength={40}
                  value={referenceInput}
                  onChange={(e) => {
                    setReferenceInput(e.target.value)
                    setRefError(null)
                  }}
                  disabled={refSuccess || submittingRef}
                  placeholder="e.g., 432109876543 or UPI-REF-1234"
                  className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-750 text-xs sm:text-sm text-white placeholder-zinc-500 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={refSuccess || submittingRef || !referenceInput.trim()}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    refSuccess
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 disabled:opacity-50 cursor-pointer'
                  }`}
                >
                  {submittingRef ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : refSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      <span>Recorded</span>
                    </>
                  ) : (
                    <span>Submit ID</span>
                  )}
                </button>
              </div>

              {refError && (
                <p role="alert" className="text-xs text-red-400">
                  {refError}
                </p>
              )}
              {refSuccess && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Transaction reference saved for admin verification.</span>
                </p>
              )}
            </form>

            {/* Support Actions */}
            <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-zinc-400">Need help with your UPI payment?</span>
              <div className="flex items-center gap-2">
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {phoneDial && (
                  <span className="text-zinc-600">·</span>
                )}
                {phoneDial && (
                  <a
                    href={`tel:${phoneDial}`}
                    className="inline-flex items-center gap-1 text-zinc-300 hover:text-white font-bold"
                  >
                    <Phone className="w-3.5 h-3.5 text-orange-400" />
                    <span>Call Admin</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. ORDER ITEMS MANIFEST ================= */}
        {items.length > 0 && (
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 space-y-4 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-3 border-b border-zinc-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" />
              <span>Items in this Order ({items.length})</span>
            </h3>

            <div className="divide-y divide-zinc-800/60">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                  <div className="min-w-0 pr-4">
                    <p className="font-semibold text-white truncate">{item.productName}</p>
                    <p className="text-xs text-zinc-500 font-mono">
                      Qty: {item.quantity} × {formatINR(item.unitPrice)}
                    </p>
                  </div>
                  <div className="font-mono font-bold text-white shrink-0">
                    {formatINR(item.lineTotal)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= 4. NAVIGATION ACTIONS ================= */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            to="/orders"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors"
          >
            <span>View My Orders</span>
          </Link>

          <Link
            to="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors shadow-lg"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>

        {/* Security Trust Note */}
        <div className="pt-4 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          <span>AirTouch Engineering · Direct Workshop Supply &amp; Manual Verification</span>
        </div>
      </div>
    </div>
  )
}
