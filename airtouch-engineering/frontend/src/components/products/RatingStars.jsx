import { Star, StarHalf } from 'lucide-react'

/**
 * Reusable Star Rating Display with Review Count
 */
export default function RatingStars({ rating = 0, reviewCount = 0, showCount = true, size = 'sm' }) {
  const numericRating = Number(rating) || 0
  const fullStars = Math.floor(numericRating)
  const hasHalfStar = numericRating - fullStars >= 0.3 && numericRating - fullStars <= 0.7
  const totalStars = 5

  const starSizeClasses = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <div
      className="inline-flex items-center gap-1.5"
      aria-label={`Rating: ${numericRating.toFixed(1)} out of 5 stars from ${reviewCount} reviews`}
    >
      <div className="flex items-center text-amber-400" aria-hidden="true">
        {[...Array(totalStars)].map((_, i) => {
          if (i < fullStars) {
            return (
              <Star
                key={i}
                className={`${starSizeClasses} fill-amber-400 stroke-amber-400`}
              />
            )
          }
          if (i === fullStars && hasHalfStar) {
            return (
              <StarHalf
                key={i}
                className={`${starSizeClasses} fill-amber-400 stroke-amber-400`}
              />
            )
          }
          if (i === fullStars && numericRating - fullStars > 0.7) {
            return (
              <Star
                key={i}
                className={`${starSizeClasses} fill-amber-400 stroke-amber-400`}
              />
            )
          }
          return (
            <Star
              key={i}
              className={`${starSizeClasses} text-zinc-600 stroke-zinc-600`}
            />
          )
        })}
      </div>

      <span className="text-xs font-semibold text-zinc-300">
        {numericRating.toFixed(1)}
      </span>

      {showCount && reviewCount > 0 && (
        <span className="text-[11px] text-zinc-500 font-medium">
          ({reviewCount})
        </span>
      )}
    </div>
  )
}

