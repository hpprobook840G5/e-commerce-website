import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  RotateCcw,
  ChevronDown,
  Star,
  Check,
  SlidersHorizontal,
} from 'lucide-react'
import { BRANDS, BIKE_TYPES, CATEGORIES } from '../../data/products.js'

export default function FilterSidebar({
  selectedCategory,
  onCategoryChange,
  selectedBrands,
  onToggleBrand,
  priceRange,
  onPriceChange,
  minPrice = 0,
  maxPrice = 50000,
  minRating,
  onRatingChange,
  inStockOnly,
  onToggleInStock,
  selectedBikeTypes,
  onToggleBikeType,
  onClearAll,
  activeFilterCount,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
}) {
  // Accordion collapse states
  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
    brands: true,
    bikeType: true,
    rating: true,
    availability: true,
  })

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))
  }

  const sidebarContent = (
    <div className="space-y-6">
      {/* Header & Clear All */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
            Filters
          </h3>
          {activeFilterCount > 0 && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-orange-500 text-black">
              {activeFilterCount}
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* 1. Availability (In-Stock Only) */}
      <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-850 flex items-center justify-between">
        <label
          htmlFor="filter-instock"
          className="text-xs font-bold text-zinc-200 uppercase tracking-wider cursor-pointer"
        >
          In-Stock Only
        </label>
        <button
          type="button"
          role="switch"
          id="filter-instock"
          aria-checked={inStockOnly}
          onClick={onToggleInStock}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-orange-500 ${
            inStockOnly ? 'bg-orange-500' : 'bg-zinc-800'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
              inStockOnly ? 'translate-x-4' : 'translate-x-0 bg-zinc-400'
            }`}
          />
        </button>
      </div>

      {/* 2. Price Range Slider */}
      <div className="border-b border-zinc-850 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-xs font-extrabold uppercase tracking-wider text-zinc-300 hover:text-white mb-3"
        >
          <span>Price Range</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              openSections.price ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.price && (
          <div className="space-y-3 pt-1">
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              step={500}
              value={priceRange[1]}
              onChange={(e) => onPriceChange([priceRange[0], Number(e.target.value)])}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400">
              <span>₹{priceRange[0].toLocaleString('en-IN')}</span>
              <span className="text-orange-400">
                Up to ₹{priceRange[1].toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Category Filter */}
      <div className="border-b border-zinc-850 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full text-xs font-extrabold uppercase tracking-wider text-zinc-300 hover:text-white mb-3"
        >
          <span>Category</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              openSections.categories ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.categories && (
          <div className="space-y-1 pt-1 max-h-52 overflow-y-auto pr-1">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase()
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryChange(cat.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-orange-500/15 text-orange-400 font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  <span>{cat.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. Bike Type Compatibility */}
      <div className="border-b border-zinc-850 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('bikeType')}
          className="flex items-center justify-between w-full text-xs font-extrabold uppercase tracking-wider text-zinc-300 hover:text-white mb-3"
        >
          <span>Bike Compatibility</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              openSections.bikeType ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.bikeType && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {BIKE_TYPES.filter((t) => t !== 'All').map((type) => {
              const isSelected = selectedBikeTypes.includes(type)
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onToggleBikeType(type)}
                  className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500 text-black shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {type}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 5. Brand Filter */}
      <div className="border-b border-zinc-850 pb-5">
        <button
          type="button"
          onClick={() => toggleSection('brands')}
          className="flex items-center justify-between w-full text-xs font-extrabold uppercase tracking-wider text-zinc-300 hover:text-white mb-3"
        >
          <span>Brands</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              openSections.brands ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.brands && (
          <div className="space-y-1.5 pt-1 max-h-52 overflow-y-auto pr-1">
            {BRANDS.map((brand) => {
              const isSelected = selectedBrands.includes(brand)
              return (
                <label
                  key={brand}
                  className="flex items-center gap-2.5 px-2 py-1 rounded-md hover:bg-zinc-900/60 cursor-pointer text-xs text-zinc-300"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleBrand(brand)}
                    className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-700 text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                  />
                  <span className={isSelected ? 'text-orange-400 font-semibold' : ''}>
                    {brand}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* 6. Customer Rating */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('rating')}
          className="flex items-center justify-between w-full text-xs font-extrabold uppercase tracking-wider text-zinc-300 hover:text-white mb-3"
        >
          <span>Minimum Rating</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              openSections.rating ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.rating && (
          <div className="space-y-1.5 pt-1">
            {[4.5, 4.0, 3.5, 0].map((starThreshold) => {
              const isSelected = minRating === starThreshold
              return (
                <button
                  key={starThreshold}
                  type="button"
                  onClick={() => onRatingChange(starThreshold)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-orange-500/15 text-orange-400 font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {starThreshold > 0 ? (
                      <>
                        <div className="flex items-center text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < Math.floor(starThreshold)
                                  ? 'fill-amber-400 stroke-amber-400'
                                  : 'text-zinc-700 stroke-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span>& Up</span>
                      </>
                    ) : (
                      <span>All Ratings</span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sticky Sidebar (Hidden on mobile/tablet) */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-28 p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile / Tablet Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Filter Options"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobileDrawer}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Slide-in Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-xs h-full bg-zinc-950 border-l border-zinc-800 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto z-10"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
                  <span className="text-sm font-extrabold uppercase tracking-wider text-white">
                    Refine Catalog
                  </span>
                  <button
                    type="button"
                    onClick={onCloseMobileDrawer}
                    aria-label="Close filters drawer"
                    className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {sidebarContent}
              </div>

              {/* Bottom Sticky Action Button for Mobile */}
              <div className="mt-8 pt-4 border-t border-zinc-800 sticky bottom-0 bg-zinc-950">
                <button
                  type="button"
                  onClick={onCloseMobileDrawer}
                  className="w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

