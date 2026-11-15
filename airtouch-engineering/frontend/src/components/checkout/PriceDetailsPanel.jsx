import { Link } from 'react-router-dom'
import { ShieldCheck, Tag, CheckCircle2 } from 'lucide-react'
import {
  formatINR,
  formatNegativeDiscount,
} from './priceSummary.js'
import { SAVINGS_BANNER_MIN } from '../../config/checkout.js'

export default function PriceDetailsPanel({
  summary,
  showPrimaryCta = false,
  ctaText = 'Continue',
  onCtaClick,
  ctaDisabled = false,
  ctaDisabledReason = '',
}) {
  const {
    sellingTotal = 0,
    mrpTotal = 0,
    discount = 0,
    platformFee = 0,
    deliveryFee = 0,
    total = 0,
    savings = 0,
  } = summary || {}

  const hasSavings = savings > SAVINGS_BANNER_MIN

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 shadow-xl backdrop-blur-sm">
        {/* Title */}
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-4 border-b border-zinc-800">
          Price Details
        </h2>

        {/* Breakdown Rows */}
        <div className="py-4 space-y-3.5 text-xs sm:text-sm">
          {/* 1. Selling Price */}
          <div className="flex justify-between items-center text-zinc-300">
            <span>Selling Price (incl. of all taxes)</span>
            <span className="font-mono font-medium text-white">
              {formatINR(sellingTotal)}
            </span>
          </div>

          {/* 2. Platform Fee */}
          <div className="flex justify-between items-center text-zinc-300">
            <span
              className="border-b border-dotted border-zinc-500 cursor-help"
              title="Standard platform fee per order to support continuous platform enhancements and 24/7 support."
            >
              Platform Fee
            </span>
            <span className="font-mono font-medium text-white">
              {formatINR(platformFee)}
            </span>
          </div>

          {/* 3. Discount on Selling Price */}
          {discount > 0 && (
            <div className="flex justify-between items-center text-emerald-400">
              <span>Discount on Selling Price</span>
              <span className="font-mono font-bold">
                {formatNegativeDiscount(discount)}
              </span>
            </div>
          )}

          {/* 4. Delivery Charges */}
          {sellingTotal > 0 && (
            <div className="flex justify-between items-center text-zinc-300">
              <span>Delivery Charges</span>
              {deliveryFee === 0 ? (
                <span className="font-mono font-bold text-emerald-400">
                  Free
                </span>
              ) : (
                <span className="font-mono font-medium text-white">
                  {formatINR(deliveryFee)}
                </span>
              )}
            </div>
          )}

          {/* 5. Dashed Divider */}
          <div className="border-t border-dashed border-zinc-800 my-2" aria-hidden="true" />

          {/* 6. Total Amount */}
          <div className="flex justify-between items-center text-sm sm:text-base font-bold text-white pt-1">
            <span>Total Amount</span>
            <span className="font-mono text-base sm:text-lg text-orange-400">
              {formatINR(total)}
            </span>
          </div>
        </div>

        {/* Savings banner */}
        {hasSavings && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" aria-hidden="true" />
            <span>
              You&apos;ll save {formatINR(savings)} on this order
            </span>
          </div>
        )}

        {/* Optional Desktop Primary CTA Button */}
        {showPrimaryCta && onCtaClick && (
          <div className="mt-5 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onCtaClick}
              disabled={ctaDisabled}
              className={`w-full py-3.5 px-6 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                ctaDisabled
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black shadow-[0_0_24px_rgba(249,115,22,0.35)] hover:shadow-[0_0_32px_rgba(249,115,22,0.55)] cursor-pointer'
              }`}
            >
              <span>{ctaText}</span>
            </button>
            {ctaDisabled && ctaDisabledReason && (
              <p className="text-xs text-red-400 mt-2 text-center" role="status">
                {ctaDisabledReason}
              </p>
            )}
          </div>
        )}

        {/* Trust & Guarantee Badges */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80">
          <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed text-center sm:text-left flex items-center justify-center sm:justify-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" aria-hidden="true" />
            <span>Safe and secure payments. Easy returns. 100% Authentic products.</span>
          </p>
        </div>
      </div>

      {/* Terms & Conditions line */}
      <p className="text-[11px] text-zinc-500 text-center px-2 leading-relaxed">
        By proceeding, you confirm that you&apos;re above 18 years of age and agree to our{' '}
        <Link to="/terms" className="text-zinc-400 hover:text-orange-400 underline transition-colors">
          Terms of Use
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-zinc-400 hover:text-orange-400 underline transition-colors">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}
