import { forwardRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, ShoppingCart, Loader2 } from 'lucide-react'

/**
 * AirTouch Engineering - Signature High-Performance Gradient Action Button
 */
const GradientButton = forwardRef(function GradientButton(
  {
    children,
    onClick,
    type = 'button',
    variant = 'primary', // 'primary' | 'secondary' | 'ghost'
    size = 'md', // 'sm' | 'md' | 'lg'
    isAdded = false,
    addedText = 'Added',
    isLoading = false,
    icon: Icon = ShoppingCart,
    className = '',
    disabled = false,
    fullWidth = false,
    ...props
  },
  ref
) {
  const shouldReduceMotion = useReducedMotion()

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px]',
    md: 'px-4 py-2.5 text-xs sm:text-sm min-h-[42px]',
    lg: 'px-6 py-3.5 text-sm sm:text-base min-h-[48px]',
  }[size]

  let variantClasses = ''
  if (variant === 'primary') {
    variantClasses = isAdded
      ? 'bg-emerald-500 text-black shadow-[0_0_24px_rgba(16,185,129,0.45)]'
      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:shadow-[0_0_28px_rgba(249,115,22,0.55)]'
  } else if (variant === 'secondary') {
    variantClasses =
      'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700'
  } else {
    variantClasses = 'bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-900'
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={
        shouldReduceMotion || disabled
          ? undefined
          : { scale: 1.02, transition: { duration: 0.18 } }
      }
      whileTap={
        shouldReduceMotion || disabled
          ? undefined
          : { scale: 0.96, transition: { duration: 0.12 } }
      }
      className={`relative uppercase tracking-wider font-extrabold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${sizeClasses} ${variantClasses} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-black" />
          <span>Processing...</span>
        </>
      ) : isAdded ? (
        <>
          <Check className="w-4 h-4 stroke-[3] text-black animate-in zoom-in duration-200" />
          <span>{addedText}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </motion.button>
  )
})

export default GradientButton

