import { Search, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react'

export default function SortBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalResults,
  onOpenMobileFilters,
  activeFilterCount = 0,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 px-4 sm:px-5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl mb-6">
      {/* Left: Search input & Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
        {/* Search Field */}
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search exhaust, clutch, headlight, gearbox..."
            aria-label="Filter products by name or brand"
            className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 rounded-lg py-2 pl-9 pr-8 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search input"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Results Counter */}
        <div className="text-xs text-zinc-400 font-medium">
          Showing <span className="font-bold text-white">{totalResults}</span>{' '}
          {totalResults === 1 ? 'component' : 'components'}
        </div>
      </div>

      {/* Right: Mobile Filter Button, Sort Dropdown & Grid/List Toggle */}
      <div className="flex items-center justify-between sm:justify-end gap-3">
        {/* Mobile Filters Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-orange-400" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-orange-500 text-black text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="product-sort-select"
            className="text-xs text-zinc-400 font-medium hidden sm:inline"
          >
            Sort by:
          </label>
          <select
            id="product-sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
          >
            <option value="featured">Featured / Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">Newest Arrivals</option>
            <option value="rating">Top Customer Rated</option>
          </select>
        </div>

        {/* Grid vs List View Toggle */}
        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            aria-label="Grid layout view"
            aria-pressed={viewMode === 'grid'}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-zinc-800 text-orange-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            aria-label="List layout view"
            aria-pressed={viewMode === 'list'}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-zinc-800 text-orange-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

