import { useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const FIXED_PART_CATEGORIES = [
  { slug: 'all', label: 'All Parts' },
  { slug: 'seat', label: 'Seat' },
  { slug: 'headlight', label: 'Headlight' },
  { slug: 'exhaust', label: 'Exhaust' },
  { slug: 'fuel-tank', label: 'Fuel Tank' },
  { slug: 'front-tire', label: 'Front Tire' },
  { slug: 'rear-tire', label: 'Rear Tire' },
  { slug: 'handlebars', label: 'Handlebars' },
]

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawCategory = (searchParams.get('category') || 'all').toLowerCase()

  const activeCategoryObj =
    FIXED_PART_CATEGORIES.find((c) => c.slug === rawCategory) ||
    FIXED_PART_CATEGORIES[0]

  const handleSelectCategory = (slug) => {
    if (slug === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ category: slug })
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <span className="text-xs font-bold tracking-[0.25em] text-orange-500 uppercase">
              AIRTOUCH ENGINEERING CATALOG
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight mt-1">
              {activeCategoryObj.slug === 'all'
                ? 'Motorcycle Spare Parts'
                : `${activeCategoryObj.label} Components`}
            </h1>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to 3D Showcase</span>
          </Link>
        </div>

        {/* Fixed Category Filter Bar */}
        <nav
          aria-label="Product Categories"
          className="flex flex-wrap items-center gap-2 py-6 border-b border-zinc-900"
        >
          {FIXED_PART_CATEGORIES.map((cat) => {
            const isActive = activeCategoryObj.slug === cat.slug
            return (
              <button
                key={cat.slug}
                type="button"
                data-category-pill={cat.slug}
                aria-pressed={isActive}
                onClick={() => handleSelectCategory(cat.slug)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                  isActive
                    ? 'bg-orange-500 text-black shadow-[0_0_16px_rgba(249,115,22,0.4)]'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </nav>

        {/* Active Filter Status */}
        <div className="mt-8 p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 text-center">
          <p className="text-sm text-zinc-300">
            Showing catalog filter:{' '}
            <span
              data-testid="active-category-label"
              className="font-bold text-orange-400 uppercase tracking-wider"
            >
              {activeCategoryObj.label}
            </span>
          </p>
        </div>
      </div>
    </main>
  )
}
