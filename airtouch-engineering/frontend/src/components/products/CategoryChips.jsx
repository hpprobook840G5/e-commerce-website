import { useRef } from 'react'
import {
  Layers,
  Wrench,
  CircleDot,
  Zap,
  Sliders,
  Shield,
  Sun,
  Flame,
} from 'lucide-react'
import { CATEGORIES } from '../../data/products.js'

function getIconComponent(iconName) {
  switch (iconName) {
    case 'Wrench':
      return Wrench
    case 'CircleDot':
      return CircleDot
    case 'Zap':
      return Zap
    case 'Sliders':
      return Sliders
    case 'Shield':
      return Shield
    case 'Sun':
      return Sun
    case 'Flame':
      return Flame
    case 'Layers':
    default:
      return Layers
  }
}

export default function CategoryChips({
  activeCategory = 'all',
  onSelectCategory,
  categoryCounts = {},
}) {
  const scrollRef = useRef(null)

  return (
    <div className="relative w-full py-4 border-b border-zinc-900 overflow-hidden">
      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory.toLowerCase() === cat.id.toLowerCase()
          const Icon = getIconComponent(cat.icon)
          const count = categoryCounts[cat.id] || 0

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                isActive
                  ? 'bg-orange-500 text-black shadow-[0_0_18px_rgba(249,115,22,0.45)]'
                  : 'bg-zinc-900/90 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

