import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ChevronRight, Home, X, RotateCcw, Sparkles } from 'lucide-react'
import { PRODUCTS, CATEGORIES, BRANDS } from '../../data/products.js'
import { fetchStorefrontProducts } from '../../services/productsApi.js'
import CategoryChips from '../../components/products/CategoryChips.jsx'
import SortBar from '../../components/products/SortBar.jsx'
import FilterSidebar from '../../components/products/FilterSidebar.jsx'
import ProductGrid from '../../components/products/ProductGrid.jsx'
import Pagination from '../../components/products/Pagination.jsx'
import QuickViewModal from '../../components/products/QuickViewModal.jsx'

const ITEMS_PER_PAGE = 12

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. URL State Synchronization
  const urlCategory = searchParams.get('category') || 'all'
  const urlSearch = searchParams.get('search') || ''

  // 2. Filter & Sort States
  const [productsList, setProductsList] = useState(PRODUCTS)
  const [isCachedNote, setIsCachedNote] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(urlCategory)
  const [searchQuery, setSearchQuery] = useState(urlSearch)
  const [sortBy, setSortBy] = useState('featured')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedBrands, setSelectedBrands] = useState([])
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [minRating, setMinRating] = useState(0)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [selectedBikeTypes, setSelectedBikeTypes] = useState([])

  // 3. UI Interaction States
  const [currentPage, setCurrentPage] = useState(1)
  const [loadedCount, setLoadedCount] = useState(ITEMS_PER_PAGE)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [isSimulatedLoading, setIsSimulatedLoading] = useState(false)

  // Fetch products from API on mount
  useEffect(() => {
    let isMounted = true
    fetchStorefrontProducts().then((res) => {
      if (isMounted && res.products && res.products.length > 0) {
        setProductsList(res.products)
        setIsCachedNote(res.isCached)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Sync state if URL changes (e.g. from 3D model hotspot navigation or Navbar search)
  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(urlCategory.toLowerCase())
    }
  }, [urlCategory])

  useEffect(() => {
    if (urlSearch !== undefined) {
      setSearchQuery(urlSearch)
    }
  }, [urlSearch])

  // Update URL search params when category or search change
  const updateUrlParams = useCallback(
    (newCat, newSearch) => {
      const params = {}
      if (newCat && newCat !== 'all') params.category = newCat
      if (newSearch && newSearch.trim()) params.search = newSearch.trim()
      setSearchParams(params, { replace: true })
    },
    [setSearchParams]
  )

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId)
    setCurrentPage(1)
    setLoadedCount(ITEMS_PER_PAGE)
    updateUrlParams(catId, searchQuery)
  }

  const handleSearchChange = (query) => {
    setSearchQuery(query)
    setCurrentPage(1)
    setLoadedCount(ITEMS_PER_PAGE)
    updateUrlParams(selectedCategory, query)
  }

  const handleToggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    )
    setCurrentPage(1)
  }

  const handleToggleBikeType = (bikeType) => {
    setSelectedBikeTypes((prev) =>
      prev.includes(bikeType)
        ? prev.filter((t) => t !== bikeType)
        : [...prev, bikeType]
    )
    setCurrentPage(1)
  }

  const handleClearAllFilters = () => {
    setSelectedCategory('all')
    setSearchQuery('')
    setSelectedBrands([])
    setPriceRange([0, 50000])
    setMinRating(0)
    setInStockOnly(false)
    setSelectedBikeTypes([])
    setCurrentPage(1)
    setLoadedCount(ITEMS_PER_PAGE)
    setSearchParams({}, { replace: true })
  }

  // Calculate active category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: productsList.length }
    CATEGORIES.forEach((cat) => {
      if (cat.id === 'all') return
      counts[cat.id] = productsList.filter((p) => {
        if (p.category === cat.id) return true
        if (cat.aliases && cat.aliases.some((alias) => p.category.includes(alias))) {
          return true
        }
        return false
      }).length
    })
    return counts
  }, [productsList])

  // Calculate active filter count for the badge
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedCategory !== 'all') count++
    if (searchQuery.trim()) count++
    if (selectedBrands.length > 0) count += selectedBrands.length
    if (priceRange[1] < 50000) count++
    if (minRating > 0) count++
    if (inStockOnly) count++
    if (selectedBikeTypes.length > 0) count += selectedBikeTypes.length
    return count
  }, [
    selectedCategory,
    searchQuery,
    selectedBrands,
    priceRange,
    minRating,
    inStockOnly,
    selectedBikeTypes,
  ])

  // Filter & Sort Pipeline
  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      // 1. Category Matching (including alias mapping for 3D model links)
      if (selectedCategory !== 'all') {
        const catObj = CATEGORIES.find(
          (c) => c.id.toLowerCase() === selectedCategory.toLowerCase()
        )
        const matchesDirect =
          product.category.toLowerCase() === selectedCategory.toLowerCase()
        const matchesAlias =
          catObj?.aliases &&
          catObj.aliases.some((a) =>
            product.category.toLowerCase().includes(a.toLowerCase())
          )
        if (!matchesDirect && !matchesAlias) return false
      }

      // 2. Search Text Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = product.name.toLowerCase().includes(q)
        const matchBrand = product.brand.toLowerCase().includes(q)
        const matchCat = product.categoryName?.toLowerCase().includes(q)
        const matchDesc = product.description.toLowerCase().includes(q)
        if (!matchName && !matchBrand && !matchCat && !matchDesc) return false
      }

      // 3. Brands
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
        return false
      }

      // 4. Price Range
      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false
      }

      // 5. Minimum Rating
      if (minRating > 0 && product.rating < minRating) {
        return false
      }

      // 6. In Stock Only
      if (inStockOnly && (!product.stock || product.stock <= 0)) {
        return false
      }

      // 7. Bike Compatibility
      if (selectedBikeTypes.length > 0) {
        const prodTypes = Array.isArray(product.bikeType)
          ? product.bikeType
          : [product.bikeType]
        const hasOverlap = selectedBikeTypes.some((t) => prodTypes.includes(t))
        if (!hasOverlap) return false
      }

      return true
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'newest') {
        const aIsNew = a.badges?.some((bg) => bg.includes('New')) ? 1 : 0
        const bIsNew = b.badges?.some((bg) => bg.includes('New')) ? 1 : 0
        return bIsNew - aIsNew
      }
      // Default: 'featured'
      const aFeat = a.featured ? 1 : 0
      const bFeat = b.featured ? 1 : 0
      if (aFeat !== bFeat) return bFeat - aFeat
      return b.reviewCount - a.reviewCount
    })
  }, [
    selectedCategory,
    searchQuery,
    selectedBrands,
    priceRange,
    minRating,
    inStockOnly,
    selectedBikeTypes,
    sortBy,
    productsList,
  ])

  // Pagination calculations
  const totalResults = filteredProducts.length
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + loadedCount)
  }, [filteredProducts, currentPage, loadedCount])

  const canLoadMore = loadedCount < totalResults

  const handleLoadMore = () => {
    setLoadedCount((prev) => Math.min(prev + ITEMS_PER_PAGE, totalResults))
  }

  // Active Category Name
  const currentCategoryObj =
    CATEGORIES.find(
      (c) => c.id.toLowerCase() === selectedCategory.toLowerCase()
    ) || CATEGORIES[0]

  return (
    <main className="min-h-screen bg-zinc-950 text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ================= BREADCRUMB & HEADER ================= */}
        <header className="pb-6 border-b border-zinc-900">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-3"
          >
            <Link
              to="/"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <Link
              to="/products"
              onClick={() => handleSelectCategory('all')}
              className={`hover:text-white transition-colors ${
                selectedCategory === 'all' ? 'text-orange-400 font-bold' : ''
              }`}
            >
              Products
            </Link>
            {selectedCategory !== 'all' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-orange-400 font-bold">
                  {currentCategoryObj.name}
                </span>
              </>
            )}
          </nav>

          {/* Title & Subtitle */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-[11px] font-extrabold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Professional Engineering Catalog</span>
                </div>
                {import.meta.env.DEV && isCachedNote && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/25">
                    Showing cached catalogue
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
                {selectedCategory === 'all'
                  ? 'High-Performance Motorcycle Parts'
                  : `${currentCategoryObj.name}`}
              </h1>
              <p className="mt-2 text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Track-tested exhaust systems, bi-LED matrix headlights, race-spec slipper clutches,
                close-ratio gearboxes, and Brembo braking hardware engineered for street and circuit.
              </p>
            </div>

            {/* Back to 3D Showcase link */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs font-extrabold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors shrink-0"
            >
              <span>View 3D Bike Showcase</span>
              <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
            </Link>
          </div>
        </header>

        {/* ================= CATEGORY CHIPS ROW ================= */}
        <CategoryChips
          activeCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          categoryCounts={categoryCounts}
        />

        {/* ================= ACTIVE FILTER CHIPS ROW ================= */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 py-3 px-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-1">
              Active Filters:
            </span>

            {/* Category tag */}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/15 border border-orange-500/40 text-orange-400">
                <span>Category: {currentCategoryObj.name}</span>
                <button
                  type="button"
                  onClick={() => handleSelectCategory('all')}
                  aria-label="Remove category filter"
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Search query tag */}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200">
                <span>Search: "{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  aria-label="Clear search filter"
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Brand tags */}
            {selectedBrands.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200"
              >
                <span>{b}</span>
                <button
                  type="button"
                  onClick={() => handleToggleBrand(b)}
                  aria-label={`Remove brand ${b}`}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Bike types */}
            {selectedBikeTypes.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200"
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => handleToggleBikeType(t)}
                  aria-label={`Remove bike type ${t}`}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Price cap */}
            {priceRange[1] < 50000 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200">
                <span>Under ₹{priceRange[1].toLocaleString('en-IN')}</span>
                <button
                  type="button"
                  onClick={() => setPriceRange([0, 50000])}
                  aria-label="Reset price filter"
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Min Rating */}
            {minRating > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200">
                <span>{minRating}★ & Above</span>
                <button
                  type="button"
                  onClick={() => setMinRating(0)}
                  aria-label="Reset rating filter"
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* In stock */}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200">
                <span>In Stock Only</span>
                <button
                  type="button"
                  onClick={() => setInStockOnly(false)}
                  aria-label="Remove in stock filter"
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Clear All button */}
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 ml-2 inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
        )}

        {/* ================= MAIN CONTENT LAYOUT ================= */}
        <div className="mt-6 flex flex-col lg:flex-row items-start gap-8">
          {/* Left Sidebar Filters */}
          <FilterSidebar
            selectedCategory={selectedCategory}
            onCategoryChange={handleSelectCategory}
            selectedBrands={selectedBrands}
            onToggleBrand={handleToggleBrand}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            minPrice={0}
            maxPrice={50000}
            minRating={minRating}
            onRatingChange={setMinRating}
            inStockOnly={inStockOnly}
            onToggleInStock={() => setInStockOnly((v) => !v)}
            selectedBikeTypes={selectedBikeTypes}
            onToggleBikeType={handleToggleBikeType}
            onClearAll={handleClearAllFilters}
            activeFilterCount={activeFilterCount}
            isMobileDrawerOpen={isMobileDrawerOpen}
            onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
          />

          {/* Right Main Catalog Content */}
          <section className="flex-1 w-full min-w-0" aria-label="Product Catalog">
            {/* Toolbar: Search, Sort, Grid/List, Result Count */}
            <SortBar
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalResults={totalResults}
              onOpenMobileFilters={() => setIsMobileDrawerOpen(true)}
              activeFilterCount={activeFilterCount}
            />

            {/* Product Grid / List */}
            <ProductGrid
              products={paginatedProducts}
              isLoading={isSimulatedLoading}
              viewMode={viewMode}
              onQuickView={(prod) => setQuickViewProduct(prod)}
              onResetFilters={handleClearAllFilters}
            />

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => {
                setCurrentPage(p)
                window.scrollTo({ top: 300, behavior: 'smooth' })
              }}
              totalItems={totalResults}
              itemsPerPage={ITEMS_PER_PAGE}
              onLoadMore={handleLoadMore}
              canLoadMore={canLoadMore}
              mode="both"
            />
          </section>
        </div>

        {/* ================= QUICK VIEW MODAL ================= */}
        <QuickViewModal
          product={quickViewProduct}
          isOpen={Boolean(quickViewProduct)}
          onClose={() => setQuickViewProduct(null)}
        />
      </div>
    </main>
  )
}
