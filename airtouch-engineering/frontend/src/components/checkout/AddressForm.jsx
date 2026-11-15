import { useState, useEffect, useRef } from 'react'
import { Loader2, AlertCircle, Info } from 'lucide-react'
import { indiaStates } from '../../data/indiaStates.js'
import { indiaDistricts } from '../../data/indiaDistricts.js'
import { lookupPincode } from '../../services/pincode.js'

export default function AddressForm({
  initialValues = {},
  onSave,
  onCancel,
  showCancel = false,
}) {
  const [fullName, setFullName] = useState(initialValues.fullName || '')
  const [mobile, setMobile] = useState(initialValues.mobile || '')
  const [pincode, setPincode] = useState(initialValues.pincode || '')
  const [addressLine1, setAddressLine1] = useState(initialValues.addressLine1 || '')
  const [landmark, setLandmark] = useState(initialValues.landmark || '')
  const [state, setState] = useState(initialValues.state || '')
  const [district, setDistrict] = useState(initialValues.district || '')

  const [fieldErrors, setFieldErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false)
  const [pincodeFallbackMessage, setPincodeFallbackMessage] = useState('')

  const abortControllerRef = useRef(null)

  // Update district options whenever state changes
  const districtList = state && indiaDistricts[state] ? indiaDistricts[state] : []

  // Auto-fill state and district when 6-digit pincode is entered
  useEffect(() => {
    const cleanPin = pincode.trim()

    // Reset fallback message if pincode changed or too short
    if (cleanPin.length < 6) {
      setPincodeFallbackMessage('')
    }

    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLookingUpPincode(true)
    setPincodeFallbackMessage('')

    lookupPincode(cleanPin, controller.signal)
      .then((res) => {
        setIsLookingUpPincode(false)
        if (res && res.success) {
          if (res.state) {
            setState(res.state)
            clearFieldError('state')
          }
          if (res.district) {
            setDistrict(res.district)
            clearFieldError('district')
          }
          setPincodeFallbackMessage('')
        } else if (res && res.error) {
          setPincodeFallbackMessage(res.error)
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setIsLookingUpPincode(false)
          setPincodeFallbackMessage(
            "We couldn't find this pincode. Please select your state and district manually."
          )
        }
      })

    return () => {
      controller.abort()
    }
  }, [pincode])

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const updated = { ...prev }
      delete updated[field]
      return updated
    })
  }

  const validateField = (field, val) => {
    const value = typeof val === 'string' ? val : ''
    switch (field) {
      case 'fullName': {
        if (!value.trim()) return 'Full name is required.'
        if (value.trim().length < 2) return 'Full name must be at least 2 characters.'
        return ''
      }
      case 'mobile': {
        const cleaned = value.replace(/\D/g, '')
        if (!cleaned) return 'Mobile number is required.'
        if (cleaned.length !== 10) return 'Enter a valid 10-digit mobile number.'
        if (!/^[6-9]/.test(cleaned)) {
          return 'Indian mobile numbers must begin with 6, 7, 8, or 9.'
        }
        return ''
      }
      case 'pincode': {
        const cleaned = value.trim()
        if (!cleaned) return 'Pincode is required.'
        if (!/^[1-9][0-9]{5}$/.test(cleaned)) {
          return 'Enter a valid 6-digit postal code (cannot start with 0).'
        }
        return ''
      }
      case 'addressLine1': {
        const trimmed = value.trim()
        if (!trimmed) return 'Address Line 1 is required.'
        if (trimmed.length < 5) return 'Address must be at least 5 characters.'
        if (trimmed.length > 120) return 'Address must not exceed 120 characters.'
        return ''
      }
      case 'landmark': {
        if (value && value.trim().length > 80) {
          return 'Landmark cannot exceed 80 characters.'
        }
        return ''
      }
      case 'state': {
        if (!value) return 'Please select your state.'
        return ''
      }
      case 'district': {
        if (!value) return 'Please select your district.'
        return ''
      }
      default:
        return ''
    }
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    let val = ''
    if (field === 'fullName') val = fullName
    else if (field === 'mobile') val = mobile
    else if (field === 'pincode') val = pincode
    else if (field === 'addressLine1') val = addressLine1
    else if (field === 'landmark') val = landmark
    else if (field === 'state') val = state
    else if (field === 'district') val = district

    const err = validateField(field, val)
    setFieldErrors((prev) => {
      const next = { ...prev }
      if (err) next[field] = err
      else delete next[field]
      return next
    })
  }

  const handleStateChange = (e) => {
    const newState = e.target.value
    setState(newState)
    setDistrict('') // Reset district when state changes
    clearFieldError('state')
    clearFieldError('district')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const errors = {}
    const fieldsToValidate = [
      { name: 'fullName', val: fullName },
      { name: 'mobile', val: mobile },
      { name: 'pincode', val: pincode },
      { name: 'addressLine1', val: addressLine1 },
      { name: 'landmark', val: landmark },
      { name: 'state', val: state },
      { name: 'district', val: district },
    ]

    for (const { name, val } of fieldsToValidate) {
      const err = validateField(name, val)
      if (err) errors[name] = err
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setTouched({
        fullName: true,
        mobile: true,
        pincode: true,
        addressLine1: true,
        landmark: true,
        state: true,
        district: true,
      })
      return
    }

    onSave({
      fullName: fullName.trim(),
      mobile: mobile.replace(/\D/g, '').trim(),
      pincode: pincode.trim(),
      addressLine1: addressLine1.trim(),
      landmark: landmark.trim(),
      state,
      district,
      country: 'India',
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4 sm:p-6 shadow-xl space-y-4"
    >
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
          Add Delivery Address
        </h3>
        <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded font-medium">
          Session only
        </span>
      </div>

      {/* Notice about session-only address */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Addresses added here apply to your current checkout session.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="checkout-fullName"
            className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
          >
            Full Name <span className="text-orange-500">*</span>
          </label>
          <input
            id="checkout-fullName"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              clearFieldError('fullName')
            }}
            onBlur={() => handleBlur('fullName')}
            aria-invalid={Boolean(fieldErrors.fullName)}
            aria-describedby={fieldErrors.fullName ? 'checkout-fullName-error' : undefined}
            placeholder="John Doe"
            className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
              fieldErrors.fullName ? 'border-red-500' : 'border-zinc-800'
            }`}
          />
          {fieldErrors.fullName && (
            <p id="checkout-fullName-error" role="alert" className="text-xs text-red-400 mt-1">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label
            htmlFor="checkout-mobile"
            className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
          >
            10-Digit Mobile Number <span className="text-orange-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-mono">
              +91
            </span>
            <input
              id="checkout-mobile"
              name="mobile"
              type="tel"
              required
              autoComplete="tel"
              maxLength={10}
              value={mobile}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '')
                setMobile(cleaned)
                clearFieldError('mobile')
              }}
              onBlur={() => handleBlur('mobile')}
              aria-invalid={Boolean(fieldErrors.mobile)}
              aria-describedby={fieldErrors.mobile ? 'checkout-mobile-error' : undefined}
              placeholder="9876543210"
              className={`w-full pl-12 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border text-xs sm:text-sm text-white placeholder-zinc-500 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                fieldErrors.mobile ? 'border-red-500' : 'border-zinc-800'
              }`}
            />
          </div>
          {fieldErrors.mobile && (
            <p id="checkout-mobile-error" role="alert" className="text-xs text-red-400 mt-1">
              {fieldErrors.mobile}
            </p>
          )}
        </div>
      </div>

      {/* Pincode with Postal lookup */}
      <div>
        <label
          htmlFor="checkout-pincode"
          className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
        >
          PIN Code <span className="text-orange-500">*</span>
        </label>
        <div className="relative">
          <input
            id="checkout-pincode"
            name="pincode"
            type="text"
            required
            autoComplete="postal-code"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6)
              setPincode(cleaned)
              clearFieldError('pincode')
            }}
            onBlur={() => handleBlur('pincode')}
            aria-invalid={Boolean(fieldErrors.pincode)}
            aria-describedby={fieldErrors.pincode ? 'checkout-pincode-error' : undefined}
            placeholder="6-digit postal code"
            className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border text-xs sm:text-sm text-white placeholder-zinc-500 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
              fieldErrors.pincode ? 'border-red-500' : 'border-zinc-800'
            }`}
          />
          {isLookingUpPincode && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-zinc-400 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
              <span>Checking...</span>
            </div>
          )}
        </div>
        {fieldErrors.pincode && (
          <p id="checkout-pincode-error" role="alert" className="text-xs text-red-400 mt-1">
            {fieldErrors.pincode}
          </p>
        )}
        {pincodeFallbackMessage && !fieldErrors.pincode && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{pincodeFallbackMessage}</span>
          </div>
        )}
      </div>

      {/* Address Line 1 */}
      <div>
        <label
          htmlFor="checkout-addressLine1"
          className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
        >
          Address Line 1 (Flat, House no., Building, Street) <span className="text-orange-500">*</span>
        </label>
        <input
          id="checkout-addressLine1"
          name="addressLine1"
          type="text"
          required
          autoComplete="street-address"
          maxLength={120}
          value={addressLine1}
          onChange={(e) => {
            setAddressLine1(e.target.value)
            clearFieldError('addressLine1')
          }}
          onBlur={() => handleBlur('addressLine1')}
          aria-invalid={Boolean(fieldErrors.addressLine1)}
          aria-describedby={fieldErrors.addressLine1 ? 'checkout-addressLine1-error' : undefined}
          placeholder="e.g., #42, Industrial Area, Sector 5"
          className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
            fieldErrors.addressLine1 ? 'border-red-500' : 'border-zinc-800'
          }`}
        />
        {fieldErrors.addressLine1 && (
          <p id="checkout-addressLine1-error" role="alert" className="text-xs text-red-400 mt-1">
            {fieldErrors.addressLine1}
          </p>
        )}
      </div>

      {/* Landmark (Optional) */}
      <div>
        <label
          htmlFor="checkout-landmark"
          className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
        >
          Landmark (Optional)
        </label>
        <input
          id="checkout-landmark"
          name="landmark"
          type="text"
          maxLength={80}
          value={landmark}
          onChange={(e) => {
            setLandmark(e.target.value)
            clearFieldError('landmark')
          }}
          onBlur={() => handleBlur('landmark')}
          aria-invalid={Boolean(fieldErrors.landmark)}
          aria-describedby={fieldErrors.landmark ? 'checkout-landmark-error' : undefined}
          placeholder="e.g., Near Metro Station / Behind HP Petrol Pump"
          className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
            fieldErrors.landmark ? 'border-red-500' : 'border-zinc-800'
          }`}
        />
        {fieldErrors.landmark && (
          <p id="checkout-landmark-error" role="alert" className="text-xs text-red-400 mt-1">
            {fieldErrors.landmark}
          </p>
        )}
      </div>

      {/* State & District Selects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* State */}
        <div>
          <label
            htmlFor="checkout-state"
            className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
          >
            State <span className="text-orange-500">*</span>
          </label>
          <select
            id="checkout-state"
            name="state"
            required
            value={state}
            onChange={handleStateChange}
            onBlur={() => handleBlur('state')}
            aria-invalid={Boolean(fieldErrors.state)}
            aria-describedby={fieldErrors.state ? 'checkout-state-error' : undefined}
            className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
              fieldErrors.state ? 'border-red-500' : 'border-zinc-800'
            }`}
          >
            <option value="">Select State</option>
            {indiaStates.map((s) => (
              <option key={s.code} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          {fieldErrors.state && (
            <p id="checkout-state-error" role="alert" className="text-xs text-red-400 mt-1">
              {fieldErrors.state}
            </p>
          )}
        </div>

        {/* District */}
        <div>
          <label
            htmlFor="checkout-district"
            className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
          >
            District <span className="text-orange-500">*</span>
          </label>
          <select
            id="checkout-district"
            name="district"
            required
            disabled={!state || districtList.length === 0}
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value)
              clearFieldError('district')
            }}
            onBlur={() => handleBlur('district')}
            aria-invalid={Boolean(fieldErrors.district)}
            aria-describedby={fieldErrors.district ? 'checkout-district-error' : undefined}
            className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              fieldErrors.district ? 'border-red-500' : 'border-zinc-800'
            }`}
          >
            <option value="">
              {!state ? 'Select state first' : 'Select District'}
            </option>
            {districtList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {fieldErrors.district && (
            <p id="checkout-district-error" role="alert" className="text-xs text-red-400 mt-1">
              {fieldErrors.district}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-2 flex items-center justify-end gap-3">
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 text-xs sm:text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          Deliver to this Address
        </button>
      </div>
    </form>
  )
}
