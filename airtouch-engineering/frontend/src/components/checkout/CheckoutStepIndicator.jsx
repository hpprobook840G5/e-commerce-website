import { Check } from 'lucide-react'

const STEPS = [
  { id: 'address', label: 'Address', number: 1 },
  { id: 'confirm', label: 'Confirm details', number: 2 },
  { id: 'payment', label: 'Payment', number: 3 },
]

export default function CheckoutStepIndicator({ currentStep = 'address', onStepClick }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)
  const safeIndex = currentIndex >= 0 ? currentIndex : 0

  return (
    <nav aria-label="Checkout Steps" className="w-full">
      <ol className="flex items-center justify-between max-w-2xl mx-auto px-2 sm:px-4 py-4">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < safeIndex
          const isActive = idx === safeIndex
          const isPending = idx > safeIndex

          return (
            <li
              key={step.id}
              className="flex-1 flex items-center last:flex-none"
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Circle badge */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : isActive
                      ? 'bg-orange-500 text-black shadow-[0_0_12px_rgba(249,115,22,0.45)]'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                  }`}
                  aria-hidden="true"
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                {/* Step label */}
                <span
                  className={`text-xs sm:text-sm font-medium tracking-wide whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-white font-bold'
                      : isCompleted
                      ? 'text-zinc-300'
                      : 'text-zinc-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line between steps */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                    idx < safeIndex ? 'bg-emerald-500/70' : 'bg-zinc-800'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
