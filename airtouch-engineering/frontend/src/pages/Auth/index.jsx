import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Gauge,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  MapPin,
  Building,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  sendOtp,
  verifyOtp,
  signInWithGoogle,
  signInWithEmailPassword,
  createAccount,
  getMe,
  normalizeIndianPhoneNumber,
} from '../../services/auth.js'
import { indiaStates } from '../../data/indiaStates.js'
import { indiaDistricts } from '../../data/indiaDistricts.js'
import { lookupPincode } from '../../services/pincode.js'

function getSafeRedirectUrl(nextParam) {
  if (!nextParam || typeof nextParam !== 'string') return '/account'
  if (nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes(':')) {
    return nextParam
  }
  return '/account'
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

export default function Auth() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const nextParam = searchParams.get('next')
  const safeRedirect = getSafeRedirectUrl(nextParam)

  // Current Step: 'choice' | 'email' | 'code' | 'new-user' | 'password'
  const [step, setStep] = useState('choice')

  // Form Fields - Auth
  const [email, setEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')

  // Sign-Up / Profile Completion Fields (Step 4: new-user)
  const [fullName, setFullName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [line1, setLine1] = useState('')
  const [landmark, setLandmark] = useState('')
  const [district, setDistrict] = useState('')
  const [stateName, setStateName] = useState('')
  const [pincode, setPincode] = useState('')

  // Pincode lookup state
  const [isPincodeLoading, setIsPincodeLoading] = useState(false)
  const [pincodeLookupMessage, setPincodeLookupMessage] = useState('')
  const [pincodeLookupError, setPincodeLookupError] = useState('')
  const pincodeAbortRef = useRef(null)

  // UI state for password toggling
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Field touch tracking for inline error messages
  const [touched, setTouched] = useState({})
  const [mobileError, setMobileError] = useState('')

  // Track if this is a returning user whose profile is incomplete
  const [isReturningIncomplete, setIsReturningIncomplete] = useState(false)

  // Resend OTP Cooldown & Limits (30s cooldown, max 3 resends)
  const [countdown, setCountdown] = useState(0)
  const [resendCount, setResendCount] = useState(0)
  const timerRef = useRef(null)

  // UI States
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  // Input refs for 6-digit OTP
  const otpInputRefs = useRef([])

  // Redirect if already authenticated AND profile is complete
  useEffect(() => {
    let active = true
    if (user && step !== 'new-user') {
      getMe().then(({ data }) => {
        if (!active) return
        if (data?.profileComplete === false) {
          setIsReturningIncomplete(true)
          if (data.user?.fullName) setFullName(data.user.fullName)
          if (data.user?.mobile) setMobileNumber(data.user.mobile.replace(/^\+91/, ''))
          setStep('new-user')
        } else {
          navigate(safeRedirect, { replace: true })
        }
      }).catch(() => {
        if (active) navigate(safeRedirect, { replace: true })
      })
    }
    return () => { active = false }
  }, [user, navigate, safeRedirect, step])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pincodeAbortRef.current) pincodeAbortRef.current.abort()
    }
  }, [])

  const startResendTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(30)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // ================= FIELD VALIDATIONS =================
  const isFullNameValid = fullName.trim().length >= 2 && fullName.trim().length <= 80
  const isMobileValid = Boolean(normalizeIndianPhoneNumber(mobileNumber))
  const isPasswordValid = Boolean(newPassword && /^(?=.*[a-zA-Z])(?=.*\d).{8,72}$/.test(newPassword))
  const isConfirmPasswordValid = Boolean(confirmPassword && confirmPassword === newPassword)
  const isLine1Valid = line1.trim().length >= 5 && line1.trim().length <= 120
  const isStateValid = Boolean(stateName && indiaStates.some((s) => s.name === stateName))
  const isDistrictValid = Boolean(
    district &&
    stateName &&
    indiaDistricts[stateName] &&
    indiaDistricts[stateName].some((d) => d.toLowerCase() === district.trim().toLowerCase())
  )
  const isPincodeValid = /^[1-9][0-9]{5}$/.test(pincode.trim())

  const isFormValid = Boolean(
    isFullNameValid &&
    isMobileValid &&
    isPasswordValid &&
    isConfirmPasswordValid &&
    isLine1Valid &&
    isDistrictValid &&
    isStateValid &&
    isPincodeValid
  )

  // ================= PINCODE LOOKUP & LOCATION HANDLERS =================
  const handlePincodeChange = async (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPincode(rawVal)
    setPincodeLookupError('')
    setPincodeLookupMessage('')

    // Abort previous lookup if still pending
    if (pincodeAbortRef.current) {
      pincodeAbortRef.current.abort()
      pincodeAbortRef.current = null
    }

    if (rawVal.length === 6) {
      if (rawVal.startsWith('0')) {
        setPincodeLookupError('PIN code cannot start with 0.')
        return
      }

      const controller = new AbortController()
      pincodeAbortRef.current = controller
      setIsPincodeLoading(true)

      try {
        const result = await lookupPincode(rawVal, controller.signal)
        setIsPincodeLoading(false)

        if (!result.success) {
          setPincodeLookupError(
            result.error || "We couldn't find this pincode. Please select your state and district manually."
          )
          return
        }

        // Auto-fill state if matched
        if (result.state) {
          setStateName(result.state)
          markTouched('stateName')

          // If district matched, auto-select it; otherwise prompt user to select manually
          if (result.districtMatched && result.district) {
            setDistrict(result.district)
            markTouched('district')
            setPincodeLookupMessage(`Found: ${result.district}, ${result.state}`)
          } else {
            setDistrict('')
            setPincodeLookupMessage('Please choose your district.')
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setIsPincodeLoading(false)
          setPincodeLookupError(
            "We couldn't find this pincode. Please select your state and district manually."
          )
        }
      }
    }
  }

  const handleStateChange = (e) => {
    const selectedState = e.target.value
    setStateName(selectedState)
    setDistrict('') // Resets district whenever state changes
    setPincodeLookupMessage('')
    markTouched('stateName')
  }

  const handleDistrictChange = (e) => {
    setDistrict(e.target.value)
    setPincodeLookupMessage('')
    markTouched('district')
  }

  // ================= 1. GOOGLE SIGN-IN =================
  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setErrorMessage('')
    const callbackTarget = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeRedirect)}`
    const { error } = await signInWithGoogle(callbackTarget)
    if (error) {
      setErrorMessage(error.message || 'Google sign-in could not be completed.')
      setIsLoading(false)
    }
  }

  // ================= 2. EMAIL OTP REQUEST =================
  const handleSendEmailOtp = async (e) => {
    if (e) e.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    if (resendCount >= 3) {
      setErrorMessage('Maximum resend attempts reached. Please check your inbox or try again in 15 minutes.')
      return
    }

    setIsLoading(true)
    const { error } = await sendOtp(cleanEmail)
    setIsLoading(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setResendCount((prev) => prev + 1)
    setStep('code')
    setOtpDigits(['', '', '', '', '', ''])
    setInfoMessage(`We've sent a 6-digit verification code to ${cleanEmail}.`)
    startResendTimer()

    setTimeout(() => {
      if (otpInputRefs.current[0]) {
        otpInputRefs.current[0].focus()
      }
    }, 100)
  }

  // ================= 3. OTP DIGIT INPUT HANDLING =================
  const handleOtpChange = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1)
    const updated = [...otpDigits]
    updated[index] = char
    setOtpDigits(updated)

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }

    if (char && index === 5 && updated.every((d) => d !== '')) {
      submitVerifyOtp(updated.join(''))
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const updated = [...otpDigits]
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || ''
    }
    setOtpDigits(updated)

    if (pasted.length === 6) {
      otpInputRefs.current[5]?.focus()
      submitVerifyOtp(pasted)
    } else {
      const nextFocus = Math.min(pasted.length, 5)
      otpInputRefs.current[nextFocus]?.focus()
    }
  }

  // ================= 4. VERIFY OTP SUBMISSION =================
  const submitVerifyOtp = async (codeToVerify) => {
    const token = codeToVerify || otpDigits.join('')
    if (token.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    const { data, error } = await verifyOtp(email, token)
    setIsLoading(false)

    if (error) {
      setErrorMessage(error.message || 'Invalid or expired code. Please try again.')
      return
    }

    // Prompt new customers or returning users without complete profile
    if (data?.isNewUser || data?.user?.profileComplete === false) {
      setIsReturningIncomplete(!data?.isNewUser && data?.user?.profileComplete === false)
      if (data?.user?.fullName) setFullName(data.user.fullName)
      if (data?.user?.mobile) setMobileNumber(data.user.mobile.replace(/^\+91/, ''))
      setStep('new-user')
    } else {
      navigate(safeRedirect, { replace: true })
    }
  }

  // ================= 5. COMPLETE PROFILE SUBMISSION =================
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setMobileError('')

    const normalizedPhone = normalizeIndianPhoneNumber(mobileNumber)
    if (!normalizedPhone) {
      setMobileError('Please enter a valid 10-digit Indian mobile number starting with 6-9.')
      return
    }

    if (!isFormValid) {
      setErrorMessage('Please review and complete all required fields.')
      return
    }

    setIsLoading(true)

    const payload = {
      fullName: fullName.trim(),
      mobile: normalizedPhone,
      password: newPassword,
      confirmPassword,
      address: {
        line1: line1.trim(),
        landmark: landmark.trim() || undefined,
        district: district.trim(),
        city: district.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        country: 'India',
      },
    }

    const { error, status } = await createAccount(payload)
    setIsLoading(false)

    if (error) {
      if (status === 409) {
        if (error.message.toLowerCase().includes('mobile') || error.message.toLowerCase().includes('already registered')) {
          setMobileError(error.message)
        } else {
          setErrorMessage(error.message)
        }
      } else {
        setErrorMessage(error.message || 'Failed to complete registration. Please try again.')
      }
      return
    }

    navigate(safeRedirect, { replace: true })
  }

  // ================= 6. PASSWORD LOGIN =================
  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    if (!password) {
      setErrorMessage('Please enter your password.')
      return
    }

    setIsLoading(true)
    const { data, error } = await signInWithEmailPassword(cleanEmail, password)
    setIsLoading(false)

    if (error) {
      setErrorMessage(error.message || 'Invalid email or password.')
      return
    }

    if (data?.user?.profileComplete === false) {
      setIsReturningIncomplete(true)
      if (data?.user?.fullName) setFullName(data.user.fullName)
      if (data?.user?.mobile) setMobileNumber(data.user.mobile.replace(/^\+91/, ''))
      setStep('new-user')
    } else {
      navigate(safeRedirect, { replace: true })
    }
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-zinc-950 py-10 px-4 sm:px-6">
      <div className="w-full max-w-[420px] rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white font-black tracking-wider text-base uppercase mb-3 hover:text-orange-400 transition-colors"
          >
            <Gauge className="w-5 h-5 text-orange-500" />
            <span>AirTouch Engineering</span>
          </Link>
          <div className="h-0.5 w-12 bg-orange-500 mx-auto rounded-full" />
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in duration-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Info Banner */}
        {infoMessage && !errorMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-2.5 text-xs text-orange-300 animate-in fade-in duration-200"
          >
            <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{infoMessage}</span>
          </div>
        )}

        {/* ================= STEP 1: CHOICE SCREEN ================= */}
        {step === 'choice' && (
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white text-center tracking-tight">
              Sign In or Register
            </h1>
            <p className="mt-1.5 text-xs text-zinc-400 text-center leading-relaxed">
              Access your saved orders, garage specifications, and high-performance cart.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('')
                  setStep('email')
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(249,115,22,0.35)] transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Continue with Email OTP</span>
                <ArrowRight className="w-4 h-4 ml-auto stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-zinc-500">
                  <span className="bg-zinc-900 px-3 font-semibold">Or use credentials</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage('')
                  setStep('password')
                }}
                className="w-full py-3 px-4 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 text-zinc-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Log in with Password</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: EMAIL INPUT ================= */}
        {step === 'email' && (
          <div>
            <button
              type="button"
              onClick={() => {
                setErrorMessage('')
                setStep('choice')
              }}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to options</span>
            </button>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Enter Your Email
            </h1>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              We'll send a 6-digit verification code to sign you in or create your account.
            </p>

            <form onSubmit={handleSendEmailOtp} className="mt-6 space-y-4">
              <div>
                <label htmlFor="auth-email" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="racer@airtouch.engineering"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 text-sm text-white rounded-xl py-3 pl-10 pr-4 outline-none transition-colors placeholder-zinc-600 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(249,115,22,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ================= STEP 3: 6-DIGIT OTP VERIFICATION ================= */}
        {step === 'code' && (
          <div>
            <button
              type="button"
              onClick={() => {
                setErrorMessage('')
                setStep('email')
              }}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change email</span>
            </button>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Verify with Code
            </h1>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Enter the 6-digit code sent to your email. Check your spam folder if it doesn’t arrive shortly.
            </p>

            <div className="mt-6">
              <div
                className="grid grid-cols-6 gap-2 sm:gap-2.5"
                onPaste={handleOtpPaste}
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    aria-label={`Digit ${idx + 1} of verification code`}
                    className="w-full aspect-square text-center text-lg sm:text-xl font-mono font-black text-white bg-zinc-950 border border-zinc-800 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-colors"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => submitVerifyOtp()}
                disabled={isLoading || otpDigits.join('').length !== 6}
                className="mt-5 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(249,115,22,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              <div className="mt-5 text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-zinc-500">
                    Resend code in{' '}
                    <span className="font-mono font-bold text-orange-400">
                      {countdown}s
                    </span>
                  </p>
                ) : resendCount >= 3 ? (
                  <p className="text-xs text-zinc-500">
                    Max resend attempts reached. Please check your spam folder or wait 15 minutes.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendEmailOtp()}
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300 underline cursor-pointer"
                  >
                    Didn’t get a code? Resend
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: REQUIRED SIGN-UP / COMPLETE PROFILE ================= */}
        {step === 'new-user' && (
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Email Verified</span>
            </div>

            {isReturningIncomplete && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-2.5 text-xs text-orange-300 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-semibold">Please complete your profile to continue.</span>
              </div>
            )}

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isReturningIncomplete ? 'Complete Your Profile' : 'Customer Account Details'}
            </h1>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Set up your courier delivery profile and password. All marked fields (<span className="text-orange-400 font-bold">*</span>) are required.
            </p>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="auth-full-name" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                  Full Name <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-full-name"
                    type="text"
                    autoComplete="name"
                    required
                    aria-required="true"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => markTouched('fullName')}
                    placeholder="Marc Márquez"
                    className={`w-full bg-zinc-950 border text-sm text-white rounded-xl py-2.5 pl-10 pr-4 outline-none transition-colors placeholder-zinc-600 focus:ring-1 ${
                      touched.fullName && !isFullNameValid
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                    }`}
                  />
                </div>
                {touched.fullName && !isFullNameValid && (
                  <p className="mt-1 text-[11px] text-rose-400">Full name must be between 2 and 80 characters.</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="auth-mobile" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                  Mobile Number <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <span className="text-xs font-mono font-bold text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2">
                    +91
                  </span>
                  <input
                    id="auth-mobile"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    required
                    aria-required="true"
                    value={mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value)
                      if (mobileError) setMobileError('')
                    }}
                    onBlur={() => markTouched('mobile')}
                    placeholder="9876543210"
                    className={`w-full bg-zinc-950 border text-sm text-white rounded-xl py-2.5 pl-12 pr-4 outline-none transition-colors placeholder-zinc-600 focus:ring-1 ${
                      (touched.mobile && !isMobileValid) || mobileError
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                    }`}
                  />
                </div>
                {mobileError ? (
                  <p className="mt-1 text-[11px] text-rose-400 font-semibold">{mobileError}</p>
                ) : (
                  touched.mobile && !isMobileValid && (
                    <p className="mt-1 text-[11px] text-rose-400">
                      Enter a valid 10-digit Indian mobile starting with 6–9.
                    </p>
                  )
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="auth-new-pwd" className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Password <span className="text-orange-400">*</span>
                  </label>
                  <span className="text-[10px] text-zinc-500">8–72 chars, letter & number</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-new-pwd"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    aria-required="true"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={() => markTouched('newPassword')}
                    placeholder="••••••••"
                    className={`w-full bg-zinc-950 border text-sm text-white rounded-xl py-2.5 pl-10 pr-10 outline-none transition-colors placeholder-zinc-600 focus:ring-1 ${
                      touched.newPassword && !isPasswordValid
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {touched.newPassword && !isPasswordValid && (
                  <p className="mt-1 text-[11px] text-rose-400">
                    Must be 8–72 characters and contain at least one letter and one number.
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="auth-confirm-pwd" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                  Confirm Password <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-confirm-pwd"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    aria-required="true"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => markTouched('confirmPassword')}
                    placeholder="••••••••"
                    className={`w-full bg-zinc-950 border text-sm text-white rounded-xl py-2.5 pl-10 pr-10 outline-none transition-colors placeholder-zinc-600 focus:ring-1 ${
                      touched.confirmPassword && !isConfirmPasswordValid
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {touched.confirmPassword && !isConfirmPasswordValid && (
                  <p className="mt-1 text-[11px] text-rose-400">Passwords do not match.</p>
                )}
              </div>

              {/* Section Divider: Courier Shipping Address */}
              <div className="pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-200">
                    Courier Delivery Address
                  </span>
                </div>

                {/* Address Line 1 */}
                <div className="space-y-3">
                  <div>
                    <label htmlFor="auth-line1" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                      Street Address <span className="text-orange-400">*</span>
                    </label>
                    <input
                      id="auth-line1"
                      type="text"
                      autoComplete="street-address"
                      required
                      aria-required="true"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      onBlur={() => markTouched('line1')}
                      placeholder="Plot 42, Sector 18, Industrial Area"
                      className={`w-full bg-zinc-950 border text-sm text-white rounded-xl py-2.5 px-3.5 outline-none transition-colors placeholder-zinc-600 focus:ring-1 ${
                        touched.line1 && !isLine1Valid
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                          : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                      }`}
                    />
                    {touched.line1 && !isLine1Valid && (
                      <p className="mt-1 text-[11px] text-rose-400">Address must be between 5 and 120 characters.</p>
                    )}
                  </div>

                  {/* Landmark (Optional) */}
                  <div>
                    <label htmlFor="auth-landmark" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Landmark <span className="text-zinc-600 font-normal">(Opt)</span>
                    </label>
                    <input
                      id="auth-landmark"
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Near Metro Station / Opposite Commercial Hub"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 text-sm text-white rounded-xl py-2.5 px-3.5 outline-none transition-colors placeholder-zinc-600 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  {/* Pincode with Postal Auto-Lookup & Country */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="auth-pincode" className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                          PIN Code <span className="text-orange-400">*</span>
                        </label>
                        {isPincodeLoading && (
                          <span className="flex items-center gap-1 text-[10px] text-orange-400 font-medium">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>Looking up...</span>
                          </span>
                        )}
                      </div>
                      <input
                        id="auth-pincode"
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={6}
                        required
                        aria-required="true"
                        value={pincode}
                        onChange={handlePincodeChange}
                        onBlur={() => markTouched('pincode')}
                        placeholder="122015"
                        className={`w-full bg-zinc-950 border text-sm font-mono text-white rounded-xl py-2.5 px-3.5 outline-none transition-colors placeholder-zinc-600 focus:ring-1 ${
                          touched.pincode && !isPincodeValid
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                            : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                        }`}
                      />
                      {touched.pincode && !isPincodeValid && (
                        <p className="mt-1 text-[11px] text-rose-400">6 digits, cannot start with 0.</p>
                      )}
                      {pincodeLookupError && (
                        <p className="mt-1 text-[11px] text-amber-400 flex items-start gap-1 leading-tight">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{pincodeLookupError}</span>
                        </p>
                      )}
                      {pincodeLookupMessage && !pincodeLookupError && (
                        <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1 leading-tight">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{pincodeLookupMessage}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="auth-country" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Country
                      </label>
                      <input
                        id="auth-country"
                        type="text"
                        disabled
                        value="India"
                        className="w-full bg-zinc-950/60 border border-zinc-800 text-sm text-zinc-400 rounded-xl py-2.5 px-3.5 outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* State & District Dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="auth-state" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                        State <span className="text-orange-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="auth-state"
                          required
                          aria-required="true"
                          value={stateName}
                          onChange={handleStateChange}
                          onBlur={() => markTouched('stateName')}
                          className={`w-full bg-zinc-950 border text-sm text-white rounded-xl py-2.5 pl-3.5 pr-8 outline-none transition-colors appearance-none focus:ring-1 cursor-pointer ${
                            touched.stateName && !isStateValid
                              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                              : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                          }`}
                        >
                          <option value="" className="bg-zinc-900 text-zinc-500">
                            Select State / UT
                          </option>
                          {indiaStates.map((s) => (
                            <option key={s.code} value={s.name} className="bg-zinc-900 text-white">
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {touched.stateName && !isStateValid && (
                        <p className="mt-1 text-[11px] text-rose-400">Please select your state.</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="auth-district" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                        District <span className="text-orange-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="auth-district"
                          required
                          aria-required="true"
                          disabled={!stateName}
                          value={district}
                          onChange={handleDistrictChange}
                          onBlur={() => markTouched('district')}
                          className={`w-full bg-zinc-950 border text-sm text-white rounded-xl py-2.5 pl-3.5 pr-8 outline-none transition-colors appearance-none focus:ring-1 ${
                            !stateName ? 'opacity-50 cursor-not-allowed text-zinc-500' : 'cursor-pointer'
                          } ${
                            touched.district && !isDistrictValid
                              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                              : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500'
                          }`}
                        >
                          <option value="" className="bg-zinc-900 text-zinc-500">
                            {stateName ? 'Select District' : 'Select state first'}
                          </option>
                          {(stateName && indiaDistricts[stateName] ? indiaDistricts[stateName] : []).map((d) => (
                            <option key={d} value={d} className="bg-zinc-900 text-white">
                              {d}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {touched.district && !isDistrictValid && (
                        <p className="mt-1 text-[11px] text-rose-400">Please select your district.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(249,115,22,0.35)] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Saving details...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ================= STEP 5: PASSWORD LOGIN ================= */}
        {step === 'password' && (
          <div>
            <button
              type="button"
              onClick={() => {
                setErrorMessage('')
                setStep('choice')
              }}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to options</span>
            </button>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Password Login
            </h1>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Sign in with your registered email and account password.
            </p>

            <form onSubmit={handlePasswordLogin} className="mt-6 space-y-4">
              <div>
                <label htmlFor="pwd-email" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <input
                  id="pwd-email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="racer@airtouch.engineering"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 text-sm text-white rounded-xl py-3 px-4 outline-none transition-colors placeholder-zinc-600 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label htmlFor="pwd-val" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Password
                </label>
                <input
                  id="pwd-val"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 text-sm text-white rounded-xl py-3 px-4 outline-none transition-colors placeholder-zinc-600 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(249,115,22,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('')
                  setStep('email')
                }}
                className="text-xs text-orange-400 hover:text-orange-300 underline font-semibold block w-full cursor-pointer"
              >
                Forgot password? Sign in with one-time code
              </button>
            </div>
          </div>
        )}

        {/* Security Footer Note */}
        <div className="mt-8 pt-5 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-500/70" />
          <span>Encrypted with 256-bit SSL & Supabase Security</span>
        </div>
      </div>
    </main>
  )
}
