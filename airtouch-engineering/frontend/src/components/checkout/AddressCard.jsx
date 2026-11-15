import { Home, Phone, MapPin, Tag } from 'lucide-react'

/**
 * Renders a delivery address card.
 * Supports standard full layout (Address step) and compact one-line layout (Confirm step).
 */
export default function AddressCard({
  address,
  onChangeClick,
  compact = false,
  showChangeButton = true,
}) {
  if (!address) {
    return null
  }

  const {
    fullName,
    mobile,
    addressLine1,
    landmark,
    district,
    state,
    pincode,
    country = 'India',
    isSessionOnly = false,
    isDefault = false,
  } = address

  if (compact) {
    return (
      <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start gap-2.5 min-w-0">
          <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs sm:text-sm text-zinc-300 truncate">
            <span className="font-bold text-white mr-1.5">{fullName}</span>
            <span className="text-zinc-400">
              {addressLine1}
              {landmark ? `, near ${landmark}` : ''}, {district}, {state} - {pincode}
            </span>
            {isSessionOnly && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-orange-400 border border-orange-500/30">
                Session only
              </span>
            )}
          </div>
        </div>

        {showChangeButton && onChangeClick && (
          <button
            type="button"
            onClick={onChangeClick}
            className="text-xs font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider shrink-0 transition-colors focus:outline-none focus:ring-1 focus:ring-orange-400 rounded px-1.5 py-0.5"
            aria-label="Change delivery address"
          >
            Change
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4 sm:p-6 shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2.5">
          {/* Header row with Name, Badge and Default flag */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-orange-500 shrink-0" aria-hidden="true" />
              <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                {fullName}
              </span>
            </div>

            {isDefault && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                Default
              </span>
            )}

            {isSessionOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30">
                <Tag className="w-2.5 h-2.5" />
                Session only
              </span>
            )}
          </div>

          {/* Full address formatted */}
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {addressLine1}
            {landmark && `, near ${landmark}`}
            <br />
            {district}, {state} - <span className="font-mono font-medium text-white">{pincode}</span>
            <br />
            <span className="text-zinc-400">{country}</span>
          </p>

          {/* Contact number with phone icon */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 pt-1">
            <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
            <span className="font-mono text-zinc-200">{mobile}</span>
          </div>
        </div>

        {/* Change button */}
        {showChangeButton && onChangeClick && (
          <button
            type="button"
            onClick={onChangeClick}
            className="px-3 py-1.5 rounded-lg border border-orange-500/40 text-orange-400 hover:text-orange-300 hover:border-orange-400 text-xs font-bold uppercase tracking-wider transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            aria-label="Change delivery address"
          >
            Change
          </button>
        )}
      </div>
    </div>
  )
}
