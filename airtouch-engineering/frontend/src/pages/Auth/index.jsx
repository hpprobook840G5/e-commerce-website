import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Gauge,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from 'lucide-react'
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx'
import { indiaStates } from '../../data/indiaStates.js'
import { indiaDistricts } from '../../data/indiaDistricts.js'
import OtpInput from '../../components/auth/OtpInput.jsx'

function maskEmail(email) {
  if (!email || !email.includes('@')) return email
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`
  }
  const maskedLocal = `${local[0]}${'*'.repeat(Math.max(local.length - 2, 3))}${local[local.length - 1]}`
  return `${maskedLocal}@${domain}`
}

const VALID_FIELD_KEYS = new Set([
  'fullName',
  'email',
  'mobile',
  'password',
  'confirmPassword',
  'addressLine1',
  'landmark',
  'state',
  'district',
  'pincode',
])

const FIELD_NAME_MAP = {
  full_name: 'fullName',
  confirm_password: 'confirmPassword',
  address_line1: 'addressLine1',
  address_line_1: 'addressLine1',
  phone: 'mobile',
  phone_number: 'mobile',
  city: 'district',
  postal_code: 'pincode',
  pin: 'pincode',
}

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const {
    user,
    login,
    signup,
    verifySignup,
    resendSignup,
    forgotPassword,
    verifyPasswordReset,
    resetPassword,
    loading: isAuthLoading,
  } = useCustomerAuth()

  // Step state: 'auth' | 'signup_verify' | 'forgot_email' | 'forgot_verify' | 'forgot_reset'
  const [step, setStep] = useState('auth')

  // In 'auth' step, Mode: 'login' | 'signup'
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState(initialMode)

  // Redirect logged-in users to "/"
  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate('/', { replace: true })
    }
  }, [user, isAuthLoading, navigate])

  // Sync mode with query params
  useEffect(() => {
    const qMode = searchParams.get('mode')
    if (qMode === 'signup' || qMode === 'login') {
      setMode(qMode)
    }
  }, [searchParams])

  // Form Fields - Login & General
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Sign Up Additional Fields
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [addressLine1, setAddressLine1] = useState('')
  const [landmark, setLandmark] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [pincode, setPincode] = useState('')

  // Verification & Password Reset state
  const [otpEmail, setOtpEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  // Resend OTP Cooldown (30s)
  const [resendCooldown, setResendCooldown] = useState(0)
  const timerRef = useRef(null)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startResendTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setResendCooldown(30)
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Update district options when state changes
  const districts = selectedState ? indiaDistricts[selectedState] || [] : []

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleStateChange = (e) => {
    const newState = e.target.value
    setSelectedState(newState)
    setSelectedDistrict('')
    clearFieldError('state')
    clearFieldError('district')
  }

  const handleModeSwitch = (newMode) => {
    setMode(newMode)
    setErrorMessage('')
    setInfoMessage('')
    setFieldErrors({})
    setTouched({})
    const newParams = new URLSearchParams()
    newParams.set('mode', newMode)
    setSearchParams(newParams, { replace: true })
  }

  const validateField = (field, value) => {
    switch (field) {
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!value.trim()) return 'Email address is required.'
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address.'
        return ''
      }
      case 'password': {
        if (!value) return 'Password is required.'
        if (value.length < 8) return 'Password must be at least 8 characters.'
        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
          return 'Password must contain at least one letter and one number.'
        }
        return ''
      }
      case 'fullName': {
        if (!value.trim()) return 'Full name is required.'
        if (value.trim().length < 2) return 'Full name must be at least 2 characters.'
        if (value.trim().length > 80) return 'Full name must not exceed 80 characters.'
        return ''
      }
      case 'mobile': {
        const cleaned = value.replace(/\D/g, '')
        if (!cleaned) return 'Mobile number is required.'
        if (cleaned.length !== 10) return 'Enter a valid 10-digit mobile number.'
        if (!/^[6-9]/.test(cleaned)) return 'Indian mobile numbers must begin with 6, 7, 8, or 9.'
        return ''
      }
      case 'confirmPassword': {
        if (!value) return 'Please confirm your password.'
        if (value !== password) return 'Passwords do not match.'
        return ''
      }
      case 'confirmNewPassword': {
        if (!value) return 'Please confirm your password.'
        if (value !== newPassword) return 'Passwords do not match.'
        return ''
      }
      case 'addressLine1': {
        if (!value.trim()) return 'Address Line 1 is required.'
        if (value.trim().length < 5) return 'Address must be at least 5 characters.'
        if (value.trim().length > 120) return 'Address must not exceed 120 characters.'
        return ''
      }
      case 'landmark': {
        if (value && value.trim().length > 80) return 'Landmark cannot exceed 80 characters.'
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
      case 'pincode': {
        if (!value.trim()) return 'Pincode is required.'
        if (!/^[1-9][0-9]{5}$/.test(value.trim())) {
          return 'Enter a valid 6-digit postal code (cannot start with 0).'
        }
        return ''
      }
      default:
        return ''
    }
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    let val = ''
    if (field === 'email') val = email
    else if (field === 'password') val = password
    else if (field === 'fullName') val = fullName
    else if (field === 'mobile') val = mobile
    else if (field === 'confirmPassword') val = confirmPassword
    else if (field === 'addressLine1') val = addressLine1
    else if (field === 'landmark') val = landmark
    else if (field === 'state') val = selectedState
    else if (field === 'district') val = selectedDistrict
    else if (field === 'pincode') val = pincode

    const error = validateField(field, val)
    setFieldErrors((prev) => ({ ...prev, [field]: error }))
  }

  // Submit Handler for Auth (Login & Signup)
  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    if (mode === 'login') {
      const emailErr = validateField('email', email)
      const passErr = validateField('password', password)

      if (emailErr || passErr) {
        setFieldErrors({ email: emailErr, password: passErr })
        setTouched({ email: true, password: true })
        return
      }

      setIsSubmitting(true)
      const res = await login({ email, password })
      setIsSubmitting(false)

      if (res.success) {
        navigate('/', { replace: true })
      } else {
        if (res.code === 'EMAIL_NOT_VERIFIED') {
          // Unverified account: transition to signup_verify step
          setOtpEmail(res.email || email)
          setOtpDigits(['', '', '', '', '', ''])
          setStep('signup_verify')
          startResendTimer()
          setInfoMessage('Your email address is not yet verified. A fresh code has been sent.')
        } else {
          if (Array.isArray(res.errors) && res.errors.length > 0) {
            const newFieldErrors = {}
            const unmappedErrors = []
            res.errors.forEach((item) => {
              if (!item) return
              const rawField = item.field
              const msg = item.message
              const mappedField = FIELD_NAME_MAP[rawField] || rawField
              if (mappedField === 'email' || mappedField === 'password') {
                newFieldErrors[mappedField] = msg
              } else if (msg) {
                unmappedErrors.push(msg)
              }
            })
            if (Object.keys(newFieldErrors).length > 0) {
              setFieldErrors((prev) => ({ ...prev, ...newFieldErrors }))
            }
            if (unmappedErrors.length > 0) {
              setErrorMessage(unmappedErrors.join('. '))
            } else if (res.error) {
              setErrorMessage(res.error)
            }
          } else {
            setErrorMessage(res.error || 'Invalid email or password.')
          }
        }
      }
    } else {
      // Sign Up validation
      const errors = {
        fullName: validateField('fullName', fullName),
        email: validateField('email', email),
        mobile: validateField('mobile', mobile),
        password: validateField('password', password),
        confirmPassword: validateField('confirmPassword', confirmPassword),
        addressLine1: validateField('addressLine1', addressLine1),
        landmark: validateField('landmark', landmark),
        state: validateField('state', selectedState),
        district: validateField('district', selectedDistrict),
        pincode: validateField('pincode', pincode),
      }

      setFieldErrors(errors)
      setTouched({
        fullName: true,
        email: true,
        mobile: true,
        password: true,
        confirmPassword: true,
        addressLine1: true,
        landmark: true,
        state: true,
        district: true,
        pincode: true,
      })

      const hasError = Object.values(errors).some(Boolean)
      if (hasError) {
        setErrorMessage('Please correct the highlighted fields before submitting.')
        return
      }

      setIsSubmitting(true)
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.replace(/\D/g, ''),
        password,
        addressLine1: addressLine1.trim(),
        landmark: landmark.trim() || undefined,
        state: selectedState,
        district: selectedDistrict,
        pincode: pincode.trim(),
        country: 'India',
      }

      const res = await signup(payload)
      setIsSubmitting(false)

      if (res.success && res.status === 'verification_required') {
        setOtpEmail(res.email || email)
        setOtpDigits(['', '', '', '', '', ''])
        setStep('signup_verify')
        startResendTimer()
        setInfoMessage('We sent a 6-digit verification code to your email address.')
      } else {
        if (Array.isArray(res.errors) && res.errors.length > 0) {
          const newFieldErrors = {}
          const unmappedErrors = []
          res.errors.forEach((item) => {
            if (!item) return
            const rawField = item.field
            const msg = item.message
            const mappedField = FIELD_NAME_MAP[rawField] || rawField

            if (VALID_FIELD_KEYS.has(mappedField)) {
              newFieldErrors[mappedField] = msg
            } else if (msg) {
              unmappedErrors.push(msg)
            }
          })
          if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors((prev) => ({ ...prev, ...newFieldErrors }))
          }
          if (unmappedErrors.length > 0) {
            setErrorMessage(unmappedErrors.join('. '))
          } else if (res.error) {
            setErrorMessage(res.error)
          }
        } else {
          setErrorMessage(res.error || 'Registration failed. Please try again.')
        }
      }
    }
  }

  // Handler for Signup OTP verification
  const handleVerifySignupOtp = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    const code = otpDigits.join('').trim()
    if (code.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.')
      return
    }

    setIsSubmitting(true)
    const res = await verifySignup({ email: otpEmail, code })
    setIsSubmitting(false)

    if (res.success) {
      navigate('/', { replace: true })
    } else {
      setErrorMessage(res.error || 'Invalid or expired verification code.')
    }
  }

  // Resend Signup OTP Handler
  const handleResendSignupCode = async () => {
    if (resendCooldown > 0 || isSubmitting) return
    setErrorMessage('')
    setIsSubmitting(true)
    const res = await resendSignup({ email: otpEmail })
    setIsSubmitting(false)
    startResendTimer()
    setInfoMessage('A new verification code has been dispatched.')
  }

  // Handler for Forgot Password Email Request
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    const err = validateField('email', email)
    if (err) {
      setErrorMessage(err)
      return
    }

    setIsSubmitting(true)
    await forgotPassword({ email: email.trim().toLowerCase() })
    setIsSubmitting(false)

    setOtpEmail(email.trim().toLowerCase())
    setOtpDigits(['', '', '', '', '', ''])
    setStep('forgot_verify')
    startResendTimer()
    setInfoMessage('If that email is registered, a 6-digit code has been sent.')
  }

  // Handler for Password Reset OTP Verification
  const handleVerifyResetOtp = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    const code = otpDigits.join('').trim()
    if (code.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code.')
      return
    }

    setIsSubmitting(true)
    const res = await verifyPasswordReset({ email: otpEmail, code })
    setIsSubmitting(false)

    if (res.success && res.resetToken) {
      setResetToken(res.resetToken)
      setStep('forgot_reset')
      setInfoMessage('Code verified. You may now enter your new password.')
    } else {
      setErrorMessage(res.error || 'Invalid or expired code.')
    }
  }

  // Resend Reset Code Handler
  const handleResendResetCode = async () => {
    if (resendCooldown > 0 || isSubmitting) return
    setErrorMessage('')
    setIsSubmitting(true)
    await forgotPassword({ email: otpEmail })
    setIsSubmitting(false)
    startResendTimer()
    setInfoMessage('A fresh reset code has been dispatched.')
  }

  // Handler for Final New Password Reset Submission
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    const passErr = validateField('password', newPassword)
    const confirmErr = validateField('confirmNewPassword', confirmNewPassword)

    if (passErr || confirmErr) {
      setErrorMessage(passErr || confirmErr)
      return
    }

    setIsSubmitting(true)
    const res = await resetPassword({
      resetToken,
      password: newPassword,
      confirmPassword: confirmNewPassword,
    })
    setIsSubmitting(false)

    if (res.success) {
      navigate('/', { replace: true })
    } else {
      setErrorMessage(res.error || 'Failed to reset password. Please try again.')
    }
  }

  return (
    <main className="min-h-[calc(100vh-80px)] w-full bg-zinc-950 flex flex-col items-center justify-center py-8 px-4 sm:px-6 overflow-x-hidden selection:bg-orange-500 selection:text-black">
      {/* Container: 420px max width for precise automotive card layout */}
      <div className="w-full max-w-[420px] mx-auto flex flex-col items-center">
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center mb-6 text-center">
          <Link
            to="/"
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)] hover:border-orange-500/60 transition-all mb-3"
            aria-label="AirTouch Engineering Home"
          >
            <Gauge className="w-6 h-6" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
            AirTouch <span className="text-orange-500">Engineering</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {step === 'signup_verify' && 'Verify your email to activate account'}
            {step === 'forgot_email' && 'Reset your customer account password'}
            {step === 'forgot_verify' && 'Enter the 6-digit password reset code'}
            {step === 'forgot_reset' && 'Create a strong, new password'}
            {step === 'auth' && (mode === 'login' ? 'Sign in to access your garage & orders' : 'Create a customer account for swift checkout')}
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-zinc-900/90 border border-zinc-800/90 rounded-2xl shadow-2xl p-6 sm:p-7 backdrop-blur-md">
          {/* Top Info Alert Banner */}
          {infoMessage && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-2.5 text-orange-400 text-xs"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{infoMessage}</span>
            </div>
          )}

          {/* Top Error Alert Banner with aria-live="polite" */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* ================= STEP 1: MAIN AUTH (LOGIN | SIGN UP) ================= */}
          {step === 'auth' && (
            <>
              {/* Segmented Mode Toggle: Login | Sign Up */}
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="grid grid-cols-2 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 mb-6"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  onClick={() => handleModeSwitch('login')}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                    mode === 'login'
                      ? 'bg-orange-500 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  onClick={() => handleModeSwitch('signup')}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-orange-500 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAuthSubmit} noValidate className="space-y-4">
                {/* Sign Up: Full Name */}
                {mode === 'signup' && (
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                    >
                      Full Name <span className="text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="fullName"
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
                        aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                        placeholder="Enter your full name"
                        className={`w-full bg-zinc-950 border ${
                          fieldErrors.fullName
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                            : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                        } text-white text-xs rounded-xl pl-9 pr-3 py-2.5 placeholder-zinc-500 focus:outline-none focus:ring-1 transition-colors`}
                      />
                    </div>
                    <div aria-live="polite">
                      {fieldErrors.fullName && (
                        <p id="fullName-error" className="mt-1 text-[11px] text-rose-400 break-words">
                          {fieldErrors.fullName}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Email Address (Both Modes) */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                  >
                    Email Address <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        clearFieldError('email')
                      }}
                      onBlur={() => handleBlur('email')}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                      placeholder="name@example.com"
                      className={`w-full bg-zinc-950 border ${
                        fieldErrors.email
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                          : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                      } text-white text-xs rounded-xl pl-9 pr-3 py-2.5 placeholder-zinc-500 focus:outline-none focus:ring-1 transition-colors`}
                    />
                  </div>
                  <div aria-live="polite">
                    {fieldErrors.email && (
                      <p id="email-error" className="mt-1 text-[11px] text-rose-400 break-words">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sign Up: Mobile (+91) */}
                {mode === 'signup' && (
                  <div>
                    <label
                      htmlFor="mobile"
                      className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                    >
                      Mobile Number <span className="text-orange-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1 text-zinc-400 text-xs font-mono font-bold select-none pointer-events-none">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        <span>+91</span>
                      </div>
                      <input
                        id="mobile"
                        name="mobile"
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        autoComplete="tel-national"
                        value={mobile}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                          setMobile(val)
                          clearFieldError('mobile')
                        }}
                        onBlur={() => handleBlur('mobile')}
                        aria-invalid={Boolean(fieldErrors.mobile)}
                        aria-describedby={fieldErrors.mobile ? 'mobile-error' : undefined}
                        placeholder="98765 43210"
                        className={`w-full bg-zinc-950 border ${
                          fieldErrors.mobile
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                            : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                        } text-white text-xs rounded-xl pl-16 pr-3 py-2.5 placeholder-zinc-500 focus:outline-none focus:ring-1 font-mono transition-colors`}
                      />
                    </div>
                    <div aria-live="polite">
                      {fieldErrors.mobile && (
                        <p id="mobile-error" className="mt-1 text-[11px] text-rose-400 break-words">
                          {fieldErrors.mobile}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Password (Both Modes) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300"
                    >
                      Password <span className="text-orange-500">*</span>
                    </label>
                    {mode === 'login' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setStep('forgot_email')
                          setErrorMessage('')
                          setInfoMessage('')
                        }}
                        className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    ) : (
                      <span className="text-[10px] text-zinc-500">Min 8 chars, 1 letter, 1 number</span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        clearFieldError('password')
                      }}
                      onBlur={() => handleBlur('password')}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                      placeholder="Enter your password"
                      className={`w-full bg-zinc-950 border ${
                        fieldErrors.password
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                          : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                      } text-white text-xs rounded-xl pl-9 pr-10 py-2.5 placeholder-zinc-500 focus:outline-none focus:ring-1 transition-colors`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div aria-live="polite">
                    {fieldErrors.password && (
                      <p id="password-error" className="mt-1 text-[11px] text-rose-400 break-words">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sign Up: Confirm Password */}
                {mode === 'signup' && (
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                    >
                      Confirm Password <span className="text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          clearFieldError('confirmPassword')
                        }}
                        onBlur={() => handleBlur('confirmPassword')}
                        aria-invalid={Boolean(fieldErrors.confirmPassword)}
                        aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                        placeholder="Re-enter your password"
                        className={`w-full bg-zinc-950 border ${
                          fieldErrors.confirmPassword
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                            : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                        } text-white text-xs rounded-xl pl-9 pr-10 py-2.5 placeholder-zinc-500 focus:outline-none focus:ring-1 transition-colors`}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div aria-live="polite">
                      {fieldErrors.confirmPassword && (
                        <p id="confirmPassword-error" className="mt-1 text-[11px] text-rose-400 break-words">
                          {fieldErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Sign Up Address Fields Section */}
                {mode === 'signup' && (
                  <div className="pt-3 border-t border-zinc-800/80 space-y-3.5">
                    <div className="flex items-center gap-1.5 text-orange-500 text-xs font-bold uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Courier Delivery Address</span>
                    </div>

                    {/* Address Line 1 */}
                    <div>
                      <label
                        htmlFor="addressLine1"
                        className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                      >
                        Address Line 1 <span className="text-orange-500">*</span>
                      </label>
                      <input
                        id="addressLine1"
                        name="addressLine1"
                        type="text"
                        required
                        autoComplete="street-address"
                        value={addressLine1}
                        onChange={(e) => {
                          setAddressLine1(e.target.value)
                          clearFieldError('addressLine1')
                        }}
                        onBlur={() => handleBlur('addressLine1')}
                        aria-invalid={Boolean(fieldErrors.addressLine1)}
                        aria-describedby={fieldErrors.addressLine1 ? 'addressLine1-error' : undefined}
                        placeholder="Flat/House No., Building, Street"
                        className={`w-full bg-zinc-950 border ${
                          fieldErrors.addressLine1
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                            : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                        } text-white text-xs rounded-xl px-3 py-2.5 placeholder-zinc-500 focus:outline-none focus:ring-1 transition-colors`}
                      />
                      <div aria-live="polite">
                        {fieldErrors.addressLine1 && (
                          <p id="addressLine1-error" className="mt-1 text-[11px] text-rose-400 break-words">
                            {fieldErrors.addressLine1}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Landmark (Optional) */}
                    <div>
                      <label
                        htmlFor="landmark"
                        className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                      >
                        Landmark <span className="text-zinc-500 font-normal lowercase">(optional)</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="landmark"
                          name="landmark"
                          type="text"
                          value={landmark}
                          onChange={(e) => {
                            setLandmark(e.target.value)
                            clearFieldError('landmark')
                          }}
                          onBlur={() => handleBlur('landmark')}
                          aria-invalid={Boolean(fieldErrors.landmark)}
                          aria-describedby={fieldErrors.landmark ? 'landmark-error' : undefined}
                          placeholder="Near Metro / Landmark"
                          className={`w-full bg-zinc-950 border ${
                            fieldErrors.landmark
                              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                              : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                          } text-white text-xs rounded-xl pl-9 pr-3 py-2.5 placeholder-zinc-500 focus:outline-none focus:ring-1 transition-colors`}
                        />
                      </div>
                      <div aria-live="polite">
                        {fieldErrors.landmark && (
                          <p id="landmark-error" className="mt-1 text-[11px] text-rose-400 break-words">
                            {fieldErrors.landmark}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* State Dropdown */}
                    <div>
                      <label
                        htmlFor="state"
                        className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                      >
                        State / UT <span className="text-orange-500">*</span>
                      </label>
                      <select
                        id="state"
                        name="state"
                        required
                        value={selectedState}
                        onChange={handleStateChange}
                        onBlur={() => handleBlur('state')}
                        aria-invalid={Boolean(fieldErrors.state)}
                        aria-describedby={fieldErrors.state ? 'state-error' : undefined}
                        className={`w-full bg-zinc-950 border ${
                          fieldErrors.state
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                            : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                        } text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 transition-colors cursor-pointer`}
                      >
                        <option value="" className="bg-zinc-900 text-zinc-400">
                          -- Select State / UT --
                        </option>
                        {indiaStates.map((st) => (
                          <option key={st.code} value={st.name} className="bg-zinc-900 text-white">
                            {st.name}
                          </option>
                        ))}
                      </select>
                      <div aria-live="polite">
                        {fieldErrors.state && (
                          <p id="state-error" className="mt-1 text-[11px] text-rose-400 break-words">
                            {fieldErrors.state}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* District Dropdown (Depends on selectedState) */}
                    <div>
                      <label
                        htmlFor="district"
                        className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                      >
                        District <span className="text-orange-500">*</span>
                      </label>
                      <select
                        id="district"
                        name="district"
                        required
                        disabled={!selectedState}
                        value={selectedDistrict}
                        onChange={(e) => {
                          setSelectedDistrict(e.target.value)
                          clearFieldError('district')
                        }}
                        onBlur={() => handleBlur('district')}
                        aria-invalid={Boolean(fieldErrors.district)}
                        aria-describedby={fieldErrors.district ? 'district-error' : undefined}
                        className={`w-full bg-zinc-950 border ${
                          fieldErrors.district
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                            : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                        } ${
                          !selectedState ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 transition-colors`}
                      >
                        <option value="" className="bg-zinc-900 text-zinc-400">
                          {selectedState ? '-- Select District --' : '-- Select State First --'}
                        </option>
                        {districts.map((d) => (
                          <option key={d} value={d} className="bg-zinc-900 text-white">
                            {d}
                          </option>
                        ))}
                      </select>
                      <div aria-live="polite">
                        {fieldErrors.district && (
                          <p id="district-error" className="mt-1 text-[11px] text-rose-400 break-words">
                            {fieldErrors.district}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Pincode and Country */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="pincode"
                          className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                        >
                          Pincode <span className="text-orange-500">*</span>
                        </label>
                        <input
                          id="pincode"
                          name="pincode"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          value={pincode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                            setPincode(val)
                            clearFieldError('pincode')
                          }}
                          onBlur={() => handleBlur('pincode')}
                          aria-invalid={Boolean(fieldErrors.pincode)}
                          aria-describedby={fieldErrors.pincode ? 'pincode-error' : undefined}
                          placeholder="6-digit pin"
                          className={`w-full bg-zinc-950 border ${
                            fieldErrors.pincode
                              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                              : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                          } text-white text-xs rounded-xl px-3 py-2.5 placeholder-zinc-500 focus:outline-none focus:ring-1 font-mono transition-colors`}
                        />
                        <div aria-live="polite">
                          {fieldErrors.pincode && (
                            <p id="pincode-error" className="mt-1 text-[11px] text-rose-400 break-words">
                              {fieldErrors.pincode}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="country"
                          className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                        >
                          Country
                        </label>
                        <input
                          id="country"
                          name="country"
                          type="text"
                          readOnly
                          value="India"
                          className="w-full bg-zinc-950/60 border border-zinc-800 text-zinc-400 text-xs rounded-xl px-3 py-2.5 cursor-not-allowed select-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.45)] focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>{mode === 'login' ? 'Authenticating...' : 'Registering...'}</span>
                    </>
                  ) : (
                    <span>{mode === 'login' ? 'Log In' : 'Create Account'}</span>
                  )}
                </button>
              </form>

              {/* Toggle footer hint */}
              <div className="mt-6 pt-4 border-t border-zinc-850 text-center text-xs text-zinc-400">
                {mode === 'login' ? (
                  <p>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('signup')}
                      className="font-bold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                    >
                      Create one now
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('login')}
                      className="font-bold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                    >
                      Sign in here
                    </button>
                  </p>
                )}
              </div>
            </>
          )}

          {/* ================= STEP 2: SIGN UP EMAIL VERIFICATION ================= */}
          {step === 'signup_verify' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto mb-3 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Verify Your Email
                </h2>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Enter the 6-digit code sent to{' '}
                  <span className="text-white font-mono font-semibold">{maskEmail(otpEmail)}</span>
                </p>
              </div>

              <form onSubmit={handleVerifySignupOtp} className="space-y-4">
                <OtpInput
                  value={otpDigits}
                  onChange={setOtpDigits}
                  disabled={isSubmitting}
                  hasError={Boolean(errorMessage)}
                />

                <button
                  type="submit"
                  disabled={isSubmitting || otpDigits.some((d) => !d)}
                  className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.45)] focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>Verify &amp; Continue</span>
                  )}
                </button>
              </form>

              <div className="flex flex-col items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isSubmitting}
                  onClick={handleResendSignupCode}
                  className={`font-semibold transition-colors ${
                    resendCooldown > 0
                      ? 'text-zinc-600 cursor-not-allowed'
                      : 'text-orange-400 hover:text-orange-300 cursor-pointer'
                  }`}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('auth')
                    setErrorMessage('')
                    setInfoMessage('')
                  }}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer mt-1"
                >
                  Change email address
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: FORGOT PASSWORD - EMAIL INPUT ================= */}
          {step === 'forgot_email' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto mb-3 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Forgot Password
                </h2>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Enter your registered email address to receive a secure password reset code.
                </p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgotEmail"
                    className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                  >
                    Email Address <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="forgotEmail"
                      name="forgotEmail"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 focus:ring-orange-500 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 placeholder-zinc-500 focus:outline-none focus:ring-1 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.45)] focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <span>Send Reset Code</span>
                  )}
                </button>
              </form>

              <div className="pt-2 border-t border-zinc-800/80 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('auth')
                    setMode('login')
                    setErrorMessage('')
                    setInfoMessage('')
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Log In</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: FORGOT PASSWORD - CODE VERIFICATION ================= */}
          {step === 'forgot_verify' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto mb-3 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Enter Reset Code
                </h2>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Enter the 6-digit code sent to{' '}
                  <span className="text-white font-mono font-semibold">{maskEmail(otpEmail)}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyResetOtp} className="space-y-4">
                <OtpInput
                  value={otpDigits}
                  onChange={setOtpDigits}
                  disabled={isSubmitting}
                  hasError={Boolean(errorMessage)}
                />

                <button
                  type="submit"
                  disabled={isSubmitting || otpDigits.some((d) => !d)}
                  className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.45)] focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>
              </form>

              <div className="flex flex-col items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isSubmitting}
                  onClick={handleResendResetCode}
                  className={`font-semibold transition-colors ${
                    resendCooldown > 0
                      ? 'text-zinc-600 cursor-not-allowed'
                      : 'text-orange-400 hover:text-orange-300 cursor-pointer'
                  }`}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('forgot_email')
                    setErrorMessage('')
                    setInfoMessage('')
                  }}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer mt-1"
                >
                  Change email address
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 5: FORGOT PASSWORD - NEW PASSWORD ================= */}
          {step === 'forgot_reset' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto mb-3 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Set New Password
                </h2>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Choose a new, strong password to secure your AirTouch account.
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="newPassword"
                      className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300"
                    >
                      New Password <span className="text-orange-500">*</span>
                    </label>
                    <span className="text-[10px] text-zinc-500">Min 8 chars, 1 letter, 1 number</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 focus:ring-orange-500 text-white text-xs rounded-xl pl-9 pr-10 py-2.5 placeholder-zinc-500 focus:outline-none focus:ring-1 transition-colors"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label
                    htmlFor="confirmNewPassword"
                    className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5"
                  >
                    Confirm New Password <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 focus:ring-orange-500 text-white text-xs rounded-xl pl-9 pr-10 py-2.5 placeholder-zinc-500 focus:outline-none focus:ring-1 transition-colors"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer"
                      aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newPassword || !confirmNewPassword}
                  className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.45)] focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Reset &amp; Log In</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Security & Support Footnote */}
        <p className="text-[11px] text-zinc-500 text-center mt-6">
          Encrypted credentials with secure bcrypt hashing &amp; Bearer token storage.
        </p>

        {/* Admin Portal Link */}
        <p className="text-[11px] text-zinc-500 text-center mt-2">
          Are you an admin?{' '}
          <Link
            to="/admin/login"
            className="text-zinc-400 hover:text-orange-400 transition-colors font-medium underline underline-offset-2"
          >
            Log in here
          </Link>
        </p>
      </div>
    </main>
  )
}
