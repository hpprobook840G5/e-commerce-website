import { useRef, useEffect } from 'react'

/**
 * Reusable 6-digit OTP Input component.
 * Features:
 * - Auto-advance on input
 * - Backspace moves focus to previous input
 * - Arrow key navigation
 * - Full 6-digit paste handling across all boxes
 * - Accessible inputMode="numeric" with aria labels
 *
 * @param {object} props
 * @param {string[]} props.value - Array of 6 single-character strings
 * @param {Function} props.onChange - Handler called with new string[] of 6 digits
 * @param {boolean} props.disabled - Whether inputs are disabled
 * @param {boolean} props.hasError - Whether an error state is active
 */
export default function OtpInput({
  value = ['', '', '', '', '', ''],
  onChange,
  disabled = false,
  hasError = false,
}) {
  const inputRefs = useRef([])

  useEffect(() => {
    // Focus first input box on initial render if all are empty
    if (!disabled && inputRefs.current[0] && value.every((d) => !d)) {
      inputRefs.current[0].focus()
    }
  }, [disabled])

  const handleDigitChange = (index, char) => {
    // Only accept numeric digits
    const cleaned = char.replace(/\D/g, '')
    const nextDigits = [...value]

    if (cleaned.length > 1) {
      // If multiple digits were pasted/typed directly into this box
      const chars = cleaned.slice(0, 6).split('')
      for (let i = 0; i < 6; i++) {
        nextDigits[i] = chars[i] || ''
      }
      onChange?.(nextDigits)
      const focusIndex = Math.min(chars.length, 5)
      inputRefs.current[focusIndex]?.focus()
      return
    }

    nextDigits[index] = cleaned
    onChange?.(nextDigits)

    // Auto-advance to next box
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous box and clear it
        e.preventDefault()
        const nextDigits = [...value]
        nextDigits[index - 1] = ''
        onChange?.(nextDigits)
        inputRefs.current[index - 1]?.focus()
      } else if (value[index]) {
        // Clear current box
        const nextDigits = [...value]
        nextDigits[index] = ''
        onChange?.(nextDigits)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain')
    const cleaned = pastedData.replace(/\D/g, '').slice(0, 6)
    if (!cleaned) return

    const nextDigits = ['', '', '', '', '', '']
    for (let i = 0; i < cleaned.length; i++) {
      nextDigits[i] = cleaned[i]
    }
    onChange?.(nextDigits)

    const nextFocus = Math.min(cleaned.length, 5)
    inputRefs.current[nextFocus]?.focus()
  }

  return (
    <div
      role="group"
      aria-label="6-digit verification code"
      className="flex items-center justify-between gap-1.5 sm:gap-2.5 my-4"
    >
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          disabled={disabled}
          onChange={(e) => handleDigitChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${index + 1} of 6`}
          className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold rounded-xl bg-zinc-950 border ${
            hasError
              ? 'border-rose-500 text-rose-400 focus:border-rose-500 focus:ring-rose-500'
              : 'border-zinc-800 text-white focus:border-orange-500 focus:ring-orange-500'
          } focus:outline-none focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      ))}
    </div>
  )
}
