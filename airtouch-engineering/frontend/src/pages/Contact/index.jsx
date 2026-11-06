import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Truck,
  RotateCcw,
  ShieldCheck,
  Loader2,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { CONTACT_INFO, getWorkingHoursLiveStatus } from '../../config/contactInfo.js'
import MapEmbed from '../../components/common/MapEmbed.jsx'
import { submitContactMessage, ApiError } from '../../services/api.js'

export default function Contact() {
  const shouldReduceMotion = useReducedMotion()

  // Live status ticker in Asia/Kolkata
  const [liveStatus, setLiveStatus] = useState(() => getWorkingHoursLiveStatus())

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveStatus(getWorkingHoursLiveStatus())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    topic: 'product_fitment',
    order_id: '',
    message: '',
    website: '', // Honeypot field
  })

  const [fieldErrors, setFieldErrors] = useState({})
  const [formStatus, setFormStatus] = useState({ type: null, message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle Field Changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
    if (formStatus.type) {
      setFormStatus({ type: null, message: '' })
    }
  }

  // Client-side Validation (mirroring server rules)
  const validateForm = () => {
    const errors = {}

    // 1. Name: 2-80 chars
    const trimmedName = formData.name.trim()
    if (!trimmedName || trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters'
    } else if (trimmedName.length > 80) {
      errors.name = 'Name cannot exceed 80 characters'
    }

    // 2. Mobile: 10-digit Indian mobile starting with 6-9
    const cleanMobile = formData.mobile.replace(/\D/g, '')
    if (!cleanMobile) {
      errors.mobile = 'Mobile number is required'
    } else if (cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      errors.mobile = 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
    }

    // 3. Email: optional, but must be valid if entered
    const trimmedEmail = formData.email.trim()
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address'
    }

    // 4. Topic: required enum
    const validTopics = ['order_help', 'product_fitment', 'bulk_dealer', 'returns', 'other']
    if (!validTopics.includes(formData.topic)) {
      errors.topic = 'Please select a valid topic'
    }

    // 5. Order ID: required when topic is order_help or returns (max 40 chars, alphanumeric + dashes)
    const isOrderTopic = ['order_help', 'returns'].includes(formData.topic)
    const trimmedOrder = formData.order_id.trim()
    if (isOrderTopic) {
      if (!trimmedOrder) {
        errors.order_id = 'Order ID is required for this topic'
      } else if (trimmedOrder.length > 40) {
        errors.order_id = 'Order ID cannot exceed 40 characters'
      } else if (!/^[A-Za-z0-9-]+$/.test(trimmedOrder)) {
        errors.order_id = 'Order ID must only contain letters, numbers, and dashes (e.g. ORD-1092)'
      }
    }

    // 6. Message: 10-1000 chars
    const trimmedMsg = formData.message.trim()
    if (!trimmedMsg || trimmedMsg.length < 10) {
      errors.message = 'Message must be at least 10 characters'
    } else if (trimmedMsg.length > 1000) {
      errors.message = 'Message cannot exceed 1000 characters'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setFormStatus({ type: null, message: '' })

    try {
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.replace(/\D/g, ''),
        email: formData.email.trim() || undefined,
        topic: formData.topic,
        order_id: ['order_help', 'returns'].includes(formData.topic) ? formData.order_id.trim() : undefined,
        message: formData.message.trim(),
        website: formData.website, // Honeypot
      }

      const res = await submitContactMessage(payload)

      setFormStatus({
        type: 'success',
        message: res.message || "Thanks, we'll reply within one working day.",
      })

      // Reset form on success
      setFormData({
        name: '',
        mobile: '',
        email: '',
        topic: 'product_fitment',
        order_id: '',
        message: '',
        website: '',
      })
      setFieldErrors({})
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setFormStatus({
          type: 'error',
          message: 'Too many messages. Please try again later or contact us on WhatsApp.',
        })
      } else if (err instanceof ApiError && err.data?.errors?.length) {
        const serverErrors = {}
        err.data.errors.forEach((e) => {
          if (e.path) serverErrors[e.path] = e.msg
        })
        setFieldErrors(serverErrors)
        setFormStatus({
          type: 'error',
          message: err.message || 'Please correct the highlighted form errors.',
        })
      } else {
        setFormStatus({
          type: 'error',
          message: err.message || 'Unable to submit your message. Please try again later or contact us on WhatsApp.',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isOrderRequired = ['order_help', 'returns'].includes(formData.topic)

  return (
    <div className="bg-zinc-950 text-white selection:bg-orange-500 selection:text-black">
      {/* ================= 1. HERO SECTION ================= */}
      <section className="relative pt-16 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-900 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[140px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-orange-500 inline-block mb-3">
            AirTouch Engineering · Rider Support
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            Need help with a part or an order?
          </h1>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Reach out to our engineering and rider support team for precision fitment questions, order tracking, and technical inquiries.
          </p>

          {/* Quick FAQ Shortcuts Row */}
          <div className="mt-8 pt-6 border-t border-zinc-900/80 flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-xs font-semibold text-zinc-400">
            <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold hidden sm:inline">
              Quick Shortcuts:
            </span>
            <Link
              to="/shipping"
              className="inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-orange-500" />
              <span>Shipping Timelines</span>
            </Link>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <Link
              to="/returns"
              className="inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
              <span>Returns & Exchanges</span>
            </Link>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <Link
              to="/faq#fitment"
              className="inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
              <span>Fitment Help</span>
            </Link>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <Link
              to="/warranty"
              className="inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              <span>Warranty Coverage</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= 2. DIRECT CONTACT CHANNELS ROW ================= */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 border-b border-zinc-900 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* WhatsApp Card */}
          {CONTACT_INFO.whatsapp.url && (
            <a
              href={CONTACT_INFO.whatsapp.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="contact-whatsapp-card"
              className="group p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Instant Support
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">WhatsApp Chat</h2>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  {CONTACT_INFO.whatsapp.display || CONTACT_INFO.whatsapp.number}
                </p>
                <div className="mt-3 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex flex-col gap-0.5">
                  <span className="text-zinc-400">{CONTACT_INFO.workingHours.label}</span>
                  <span className="text-zinc-400">{CONTACT_INFO.responseTime}</span>
                </div>
              </div>
            </a>
          )}

          {/* Phone Card */}
          {CONTACT_INFO.phone.dial && (
            <a
              href={`tel:${CONTACT_INFO.phone.dial}`}
              data-testid="contact-phone-card"
              className="group p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-900 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 transition-colors" />
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                  Direct Line
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">Phone Call</h2>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  {CONTACT_INFO.phone.display}
                </p>
                <div className="mt-3 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex flex-col gap-0.5">
                  <span className="text-zinc-400">{CONTACT_INFO.workingHours.label}</span>
                  <span className="text-zinc-400">{CONTACT_INFO.responseTime}</span>
                </div>
              </div>
            </a>
          )}

          {/* Email Card */}
          {CONTACT_INFO.email.mailto && (
            <a
              href={CONTACT_INFO.email.mailto}
              data-testid="contact-email-card"
              className="group p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-900 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Written Inquiries
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">Email Support</h2>
                <p className="text-xs text-zinc-400 font-mono mt-1 truncate">
                  {CONTACT_INFO.email.full}
                </p>
                <div className="mt-3 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex flex-col gap-0.5">
                  <span className="text-zinc-400">{CONTACT_INFO.workingHours.label}</span>
                  <span className="text-zinc-400">{CONTACT_INFO.responseTime}</span>
                </div>
              </div>
            </a>
          )}
        </div>
      </section>

      {/* ================= 3. TWO-COLUMN MAIN CONTENT (FORM + OFFICE/MAP) ================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* ================= LEFT: FORM ================= */}
          <div className="lg:col-span-7">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                  Send a Message
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white mt-1">
                  Submit an Inquiry
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Fill out the form below and an engineer will review your request.
                </p>
              </div>

              {/* Status Banner */}
              {formStatus.message && (
                <div
                  role={formStatus.type === 'error' ? 'alert' : 'status'}
                  aria-live="polite"
                  data-testid="contact-form-status-banner"
                  className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed ${
                    formStatus.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}
                >
                  {formStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  )}
                  <span>{formStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
                {/* Honeypot field (hidden from genuine users) */}
                <div
                  style={{ display: 'none' }}
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  <label htmlFor="website-field">Website</label>
                  <input
                    type="text"
                    id="website-field"
                    name="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    autoComplete="off"
                    tabIndex={-1}
                  />
                </div>

                {/* Name & Mobile (2 cols on sm+) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                    >
                      Full Name <span className="text-orange-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                    />
                    {fieldErrors.name && (
                      <p
                        id="contact-name-error"
                        aria-live="polite"
                        className="mt-1 text-[11px] text-red-400"
                      >
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Mobile */}
                  <div>
                    <label
                      htmlFor="contact-mobile"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                    >
                      Mobile Number <span className="text-orange-500">*</span>
                    </label>
                    <div className="flex items-center rounded-xl bg-zinc-950 border border-zinc-800 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 overflow-hidden">
                      <span className="px-3 py-2.5 bg-zinc-900 text-xs font-bold text-zinc-400 border-r border-zinc-800 select-none">
                        +91
                      </span>
                      <input
                        id="contact-mobile"
                        name="mobile"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        autoComplete="tel"
                        required
                        value={formData.mobile}
                        onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        aria-invalid={Boolean(fieldErrors.mobile)}
                        aria-describedby={fieldErrors.mobile ? 'contact-mobile-error' : undefined}
                        className="w-full bg-transparent text-sm text-white placeholder-zinc-600 py-2.5 px-3.5 focus:outline-none font-mono"
                      />
                    </div>
                    {fieldErrors.mobile && (
                      <p
                        id="contact-mobile-error"
                        aria-live="polite"
                        className="mt-1 text-[11px] text-red-400"
                      >
                        {fieldErrors.mobile}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email & Topic */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email (Optional) */}
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                    >
                      Email Address <span className="text-zinc-500 text-[10px] normal-case font-normal">(Optional)</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="rider@example.com"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                    />
                    {fieldErrors.email && (
                      <p
                        id="contact-email-error"
                        aria-live="polite"
                        className="mt-1 text-[11px] text-red-400"
                      >
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Topic Select */}
                  <div>
                    <label
                      htmlFor="contact-topic"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                    >
                      Inquiry Topic <span className="text-orange-500">*</span>
                    </label>
                    <select
                      id="contact-topic"
                      name="topic"
                      value={formData.topic}
                      onChange={(e) => handleInputChange('topic', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                    >
                      <option value="product_fitment">Product Fitment & Compatibility</option>
                      <option value="order_help">Order Help & Dispatch Tracking</option>
                      <option value="returns">Returns & Exchanges</option>
                      <option value="bulk_dealer">Bulk & Dealer Inquiries</option>
                      <option value="other">Other Inquiry</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Order ID field */}
                {isOrderRequired && (
                  <div>
                    <label
                      htmlFor="contact-order-id"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                    >
                      Order ID <span className="text-orange-500">*</span>
                    </label>
                    <input
                      id="contact-order-id"
                      name="order_id"
                      type="text"
                      maxLength={40}
                      required
                      value={formData.order_id}
                      onChange={(e) => handleInputChange('order_id', e.target.value)}
                      placeholder="e.g. ORD-1092"
                      aria-invalid={Boolean(fieldErrors.order_id)}
                      aria-describedby={fieldErrors.order_id ? 'contact-order-id-error' : undefined}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors font-mono uppercase"
                    />
                    {fieldErrors.order_id && (
                      <p
                        id="contact-order-id-error"
                        aria-live="polite"
                        className="mt-1 text-[11px] text-red-400"
                      >
                        {fieldErrors.order_id}
                      </p>
                    )}
                  </div>
                )}

                {/* Message Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-300"
                    >
                      Your Message <span className="text-orange-500">*</span>
                    </label>
                    <span
                      data-testid="contact-char-count"
                      className={`text-[11px] font-mono ${
                        formData.message.length > 1000
                          ? 'text-red-400 font-bold'
                          : 'text-zinc-500'
                      }`}
                    >
                      {formData.message.length} / 1000
                    </span>
                  </div>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={4}
                    required
                    maxLength={1000}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Describe your motorcycle model, year, part query, or order requirements..."
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-y min-h-[110px]"
                  />
                  {fieldErrors.message && (
                    <p
                      id="contact-message-error"
                      aria-live="polite"
                      className="mt-1 text-[11px] text-red-400"
                    >
                      {fieldErrors.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="contact-submit-button"
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 active:bg-orange-600 disabled:opacity-50 text-black font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ================= RIGHT: OFFICE & MAP ================= */}
          <div className="lg:col-span-5 space-y-6">
            {/* Office Block */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                Workshop & HQ
              </span>
              <h2 className="text-xl font-black uppercase tracking-wide text-white mt-1">
                Head Office
              </h2>

              <div className="mt-5 space-y-4 text-xs text-zinc-300">
                {/* Address */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{CONTACT_INFO.address.line1}</p>
                    <p className="text-zinc-400 mt-0.5">{CONTACT_INFO.address.line2}</p>
                  </div>
                </div>

                {/* Live Working Hours Status */}
                <div className="flex items-start gap-3 pt-3 border-t border-zinc-800/80">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {CONTACT_INFO.workingHours.daysLabel} · {CONTACT_INFO.workingHours.openTime} – {CONTACT_INFO.workingHours.closeTime}
                      </span>
                    </div>
                    {/* Live status badge */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        data-testid="contact-live-status-pill"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          liveStatus.isOpen
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-750'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            liveStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                          }`}
                        />
                        <span>{liveStatus.statusText}</span>
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {liveStatus.formattedTime} IST
                      </span>
                    </div>
                  </div>
                </div>

                {/* Get Directions Link */}
                <div className="pt-3 border-t border-zinc-800/80">
                  <a
                    href={CONTACT_INFO.maps.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="contact-directions-link"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    <span>Get Directions</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Embedded Map */}
            <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
              <MapEmbed />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
