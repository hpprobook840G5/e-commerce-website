import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import {
  fetchAdminProducts,
  deleteAdminProduct,
  updateAdminProduct,
} from '../../services/adminApi.js'
import ProductDrawer from './ProductDrawer.jsx'

const CATEGORY_OPTIONS = [
  { id: 'all', name: 'All Categories' },
  { id: 'brakes', name: 'Brakes & Hydraulics' },
  { id: 'engine', name: 'Engine & Performance' },
  { id: 'chassis', name: 'Chassis & Suspension' },
  { id: 'tyres', name: 'Tyres & Wheels' },
  { id: 'exhaust', name: 'Exhaust Systems' },
  { id: 'lighting', name: 'Headlights & Lighting' },
  { id: 'seats', name: 'Seats & Bodywork' },
  { id: 'handlebars', name: 'Handlebars & Controls' },
]

export default function ProductsView() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Pagination
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'hidden'
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState(null)

  // Inline delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAdminProducts({
        page,
        limit: 20,
        search,
        category,
        status: statusFilter,
      })

      if (res.products) {
        setProducts(res.products)
        setTotalPages(res.totalPages || 1)
        setTotalCount(res.total || res.products.length)
      }
    } catch (err) {
      setError(err.message || 'Failed to load catalog products.')
    } finally {
      setLoading(false)
    }
  }, [page, search, category, statusFilter])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Open drawer for Add
  const handleAddClick = () => {
    setProductToEdit(null)
    setIsDrawerOpen(true)
  }

  // Open drawer for Edit
  const handleEditClick = (p) => {
    setProductToEdit(p)
    setIsDrawerOpen(true)
  }

  // Soft Delete (Hide) with optimistic update
  const handleConfirmDelete = async (id) => {
    setActionLoadingId(id)
    const previous = [...products]

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: false, status: 'hidden' } : p))
    )
    setConfirmDeleteId(null)

    try {
      await deleteAdminProduct(id)
    } catch (err) {
      // Rollback on error
      setProducts(previous)
      setError('Failed to hide product: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Restore (Activate) product with optimistic update
  const handleRestoreProduct = async (id) => {
    setActionLoadingId(id)
    const previous = [...products]

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: true, status: 'active' } : p))
    )

    try {
      await updateAdminProduct(id, { status: 'active' })
    } catch (err) {
      // Rollback
      setProducts(previous)
      setError('Failed to restore product: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Callback when product is saved in drawer
  const handleProductSaved = (saved) => {
    if (saved && saved.id) {
      setProducts((prev) => {
        const existingIdx = prev.findIndex((p) => p.id === saved.id)
        if (existingIdx !== -1) {
          const updated = [...prev]
          updated[existingIdx] = { ...updated[existingIdx], ...saved }
          return updated
        }
        return [saved, ...prev]
      })
    }
    loadProducts()
  }

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Component Inventory ({totalCount})
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Manage high-performance parts, pricing, stock levels, and store visibility.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-orange-500/20 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-black stroke-[3]" />
          <span>Add Component</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by part name, brand, or SKU..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
            className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Segmented Buttons */}
          <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[11px] transition-colors ${
                statusFilter === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('active')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[11px] transition-colors ${
                statusFilter === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('hidden')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[11px] transition-colors ${
                statusFilter === 'hidden'
                  ? 'bg-zinc-700 text-zinc-200'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hidden
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Table (Desktop) / Cards (Mobile) */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
          <span className="text-xs font-mono uppercase tracking-widest">
            Querying Catalog Database...
          </span>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-xs text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800">
          No components match your search and filter criteria.
        </div>
      ) : (
        <>
          {/* Desktop HTML Table (hidden below 768px) */}
          <div className="hidden md:block rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider bg-zinc-950/60">
                  <th className="py-3 px-4 w-14">Image</th>
                  <th className="py-3 px-4">Component &amp; Brand</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">MRP</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {products.map((p) => {
                  const isDeleting = confirmDeleteId === p.id
                  const isActionLoading = actionLoadingId === p.id

                  return (
                    <tr key={p.id} className="hover:bg-zinc-850/40 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                          {p.image || p.imageUrl ? (
                            <img
                              src={p.image || p.imageUrl}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                      </td>

                      {/* Name & Brand */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-white hover:text-orange-400 transition-colors line-clamp-1">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          {p.brand} · <span className="text-zinc-600">#{p.slug}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 capitalize text-zinc-300 whitespace-nowrap">
                        {p.category}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                        ₹{Number(p.price || 0).toLocaleString('en-IN')}
                      </td>

                      {/* MRP */}
                      <td className="py-3 px-4 text-right font-mono text-zinc-500 line-through whitespace-nowrap">
                        ₹{Number(p.mrp || p.price || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            p.stock <= 0
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : p.stock <= 5
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            p.is_active
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.is_active ? 'bg-emerald-400' : 'bg-zinc-500'
                            }`}
                          />
                          <span>{p.is_active ? 'Active' : 'Hidden'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isDeleting ? (
                          <div className="inline-flex items-center gap-2 bg-zinc-950 p-1.5 rounded-lg border border-red-800/80">
                            <span className="text-[11px] text-red-400 font-semibold px-1">
                              Hide from store?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(p.id)}
                              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] uppercase"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditClick(p)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Edit specifications"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {p.is_active ? (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(p.id)}
                                disabled={isActionLoading}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Hide from storefront"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRestoreProduct(p.id)}
                                disabled={isActionLoading}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Restore to storefront"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (visible below 768px) */}
          <div className="md:hidden space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                    {p.image || p.imageUrl ? (
                      <img src={p.image || p.imageUrl} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-xs leading-snug truncate">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 capitalize mt-0.5">
                      {p.category} · {p.brand}
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-mono font-bold text-white text-sm">
                        ₹{Number(p.price || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="font-mono text-zinc-500 line-through text-xs">
                        ₹{Number(p.mrp || p.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {p.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Stock: {p.stock}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditClick(p)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white font-semibold text-xs"
                    >
                      Edit
                    </button>
                    {p.is_active ? (
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-950/40 text-red-400 font-semibold text-xs border border-red-800/50"
                      >
                        Hide
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRestoreProduct(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 font-semibold text-xs border border-emerald-800/50"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span>
                Page <span className="text-white font-mono">{page}</span> of{' '}
                <span className="text-white font-mono">{totalPages}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-white cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-white cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Drawer */}
      <ProductDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        productToEdit={productToEdit}
        onProductSaved={handleProductSaved}
      />
    </div>
  )
}
