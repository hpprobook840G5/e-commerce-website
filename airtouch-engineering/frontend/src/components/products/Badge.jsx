/**
 * AirTouch Engineering - Reusable Product Badge Component
 * Supports 'Sale', 'New', 'Best Seller', 'Low Stock', and custom badges.
 */

export default function Badge({ text, className = '' }) {
  if (!text) return null

  const normalized = text.toLowerCase()

  let styleClasses = 'bg-zinc-800 text-zinc-300 border-zinc-700'

  if (normalized.includes('sale') || normalized.includes('%') || normalized.includes('off')) {
    styleClasses = 'bg-orange-500 text-black font-black border-orange-400 shadow-[0_0_14px_rgba(249,115,22,0.45)]'
  } else if (normalized.includes('best seller') || normalized.includes('popular')) {
    styleClasses = 'bg-amber-400 text-black font-extrabold border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
  } else if (normalized.includes('new')) {
    styleClasses = 'bg-emerald-500 text-black font-extrabold border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
  } else if (normalized.includes('low stock') || normalized.includes('limited')) {
    styleClasses = 'bg-rose-500/90 text-white font-extrabold border-rose-400/80 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] uppercase tracking-wider leading-none border ${styleClasses} ${className}`}
    >
      {text}
    </span>
  )
}

