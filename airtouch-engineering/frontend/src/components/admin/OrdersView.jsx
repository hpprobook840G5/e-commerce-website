import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Package,
  QrCode,
  Banknote,
  MessageSquare,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
  downloadAdminOrderInvoice,
} from '../../services/adminApi.js'

export default function OrdersView() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Selected Order Drawer
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Inline Confirmation Modal for Reverting Completed to Pending
  const [revertConfirmTarget, setRevertConfirmTarget] = useState(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null)
  const [invoiceError, setInvoiceError] = useState(null)

  const loadOrders = useCallback(async (targetPage = page) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAdminOrders({
        page: targetPage,
        limit: 20,
        status: statusFilter,
        orderType: typeFilter,
        search,
      })
      const fetchedOrders = res?.orders ?? []
      setOrders(fetchedOrders)
      setTotal(res?.total ?? fetchedOrders.length)
      setTotalPages(res?.totalPages ?? 1)
      setPage(res?.page ?? 1)

      // Sync drawer if open
      if (selectedOrder) {
        const updatedSelected = fetchedOrders.find((o) => o.id === selectedOrder.id)
        if (updatedSelected) setSelectedOrder(updatedSelected)
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve orders.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, typeFilter, search, selectedOrder])

  useEffect(() => {
    loadOrders(1)
  }, [statusFilter, typeFilter, search])

  // Handle Status Toggle with Optimistic Update
  const handleToggleStatus = async (order) => {
    const nextStatus = order.status === 'completed' ? 'pending' : 'completed'

    // If reverting from completed to pending, ask for confirmation inline
    if (order.status === 'completed' && nextStatus === 'pending') {
      setRevertConfirmTarget(order)
      return
    }

    await applyStatusUpdate(order.id, nextStatus)
  }

  const applyStatusUpdate = async (orderId, nextStatus) => {
    const prevOrders = [...orders]
    setStatusUpdatingId(orderId)

    // Optimistic update
    setOrders((current) =>
      current.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: nextStatus,
              completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
            }
          : o
      )
    )

    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => ({
        ...prev,
        status: nextStatus,
        completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
      }))
    }

    try {
      await updateAdminOrderStatus(orderId, nextStatus)
    } catch (err) {
      // Rollback on failure
      setOrders(prevOrders)
      setError(`Failed to update order status: ${err.message}`)
    } finally {
      setStatusUpdatingId(null)
      setRevertConfirmTarget(null)
    }
  }

  const handleDownloadInvoice = async (order, e) => {
    if (e) e.stopPropagation()
    if (!order?.id) return
    setDownloadingInvoiceId(order.id)
    setInvoiceError(null)
    try {
      const blob = await downloadAdminOrderInvoice(order.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${order.orderNumber || 'order'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Invoice download failed:', err)
      setInvoiceError(`Failed to download invoice for ${order.orderNumber}: ${err.message || 'Unknown error'}`)
    } finally {
      setDownloadingInvoiceId(null)
    }
  }

  const getTypeBadge = (type) => {
    const normalized = String(type || 'request').toLowerCase()
    switch (normalized) {
      case 'upi':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <QrCode className="w-3 h-3" />
            UPI
          </span>
        )
      case 'cod':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Banknote className="w-3 h-3" />
            COD
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <MessageSquare className="w-3 h-3" />
            Request
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Customer Orders ({total})
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Manage customer purchase requests, cash deliveries, and UPI verifications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadOrders(page)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, customer name, mobile, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Types</option>
            <option value="request">Request</option>
            <option value="cod">Cash on Delivery</option>
            <option value="upi">UPI</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadOrders(page)}
            className="underline text-orange-400 hover:text-orange-300 font-semibold cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {invoiceError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{invoiceError}</span>
          </div>
          <button
            type="button"
            onClick={() => setInvoiceError(null)}
            className="text-zinc-400 hover:text-white font-semibold cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
          <span className="text-xs font-mono uppercase tracking-widest">Loading Orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center text-xs text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800 space-y-2">
          <p className="font-semibold text-zinc-400">No customer orders matching criteria.</p>
          <p className="text-[11px]">
            Try adjusting your search query or status/type filter.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table (hidden below 768px) */}
          <div className="hidden md:block rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider bg-zinc-950/60">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">UPI Ref</th>
                  <th className="py-3 px-4 text-center">Invoice</th>
                  <th className="py-3 px-4 text-center">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {orders.map((o) => {
                  const isDemo = String(o.orderNumber || '').startsWith('DEMO-')
                  const isPending = o.status === 'pending'
                  const isUpdating = statusUpdatingId === o.id
                  const isDownloadingInvoice = downloadingInvoiceId === o.id

                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className="hover:bg-zinc-850/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-orange-400 group-hover:text-orange-300">
                          <span>{o.orderNumber}</span>
                          {isDemo && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-sans uppercase font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                              Demo
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{o.customerName || 'Customer'}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {o.customerMobile || o.customerEmail || '—'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getTypeBadge(o.orderType)}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-zinc-300">
                        {o.itemCount || o.items?.length || 1}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm whitespace-nowrap">
                        ₹{Number(o.total || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400 max-w-[120px] truncate">
                        {o.upiReference ? (
                          <span className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                            {o.upiReference}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleDownloadInvoice(o, e)}
                          disabled={isDownloadingInvoice}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-750 text-zinc-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                          title="Download invoice PDF"
                        >
                          {isDownloadingInvoice ? (
                            <Loader2 className="w-3 h-3 animate-spin text-orange-400" />
                          ) : (
                            <FileText className="w-3 h-3 text-orange-400" />
                          )}
                          <span>{o.status === 'completed' ? 'Download invoice' : 'Download invoice (pending)'}</span>
                        </button>
                      </td>

                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(o)}
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-2 cursor-pointer ${
                            isPending
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40 focus:ring-amber-400'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/40 focus:ring-emerald-400'
                          }`}
                          title={`Click to mark as ${isPending ? 'completed' : 'pending'}`}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isPending ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          <span>{o.status}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (below 768px) */}
          <div className="md:hidden space-y-3">
            {orders.map((o) => {
              const isDemo = String(o.orderNumber || '').startsWith('DEMO-')
              const isPending = o.status === 'pending'
              const isUpdating = statusUpdatingId === o.id

              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 shadow-md cursor-pointer hover:border-zinc-750 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-orange-400 text-xs">
                        {o.orderNumber}
                      </span>
                      {isDemo && (
                        <span className="text-[9px] px-1 py-0.2 rounded font-sans uppercase font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Demo
                        </span>
                      )}
                    </div>
                    {getTypeBadge(o.orderType)}
                  </div>

                  <div className="text-xs space-y-0.5 text-zinc-300">
                    <p className="font-semibold text-white">{o.customerName || 'Customer'}</p>
                    <p className="text-zinc-400 font-mono text-[11px]">{o.customerMobile}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {o.upiReference && (
                    <div className="text-[11px] font-mono text-purple-300 bg-purple-500/10 p-1.5 rounded border border-purple-500/20">
                      Ref: {o.upiReference}
                    </div>
                  )}

                  <div
                    className="pt-2 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <span className="text-[11px] text-zinc-500 font-mono mr-2">
                        {o.itemCount || o.items?.length || 1} items
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        ₹{Number(o.total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadInvoice(o, e)}
                        disabled={downloadingInvoiceId === o.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-zinc-700 bg-zinc-800 text-zinc-200 hover:text-white cursor-pointer disabled:opacity-50"
                        title="Download invoice PDF"
                      >
                        {downloadingInvoiceId === o.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-orange-400" />
                        ) : (
                          <FileText className="w-3 h-3 text-orange-400" />
                        )}
                        <span>{o.status === 'completed' ? 'Download invoice' : 'Download invoice (pending)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(o)}
                        disabled={isUpdating}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPending
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <span>{o.status}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800 text-xs">
              <span className="text-zinc-400">
                Page <strong className="text-white">{page}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadOrders(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => loadOrders(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= INLINE REVERT CONFIRMATION MODAL ================= */}
      {revertConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-base">Revert Order to Pending?</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Order <strong className="text-orange-400 font-mono">{revertConfirmTarget.orderNumber}</strong> is currently marked as Completed. Reverting it will clear its completion timestamp and exclude it from sales revenue analytics.
            </p>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRevertConfirmTarget(null)}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => applyStatusUpdate(revertConfirmTarget.id, 'pending')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider"
              >
                Confirm Revert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RIGHT-SIDE ORDER DETAILS DRAWER ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />

          <aside className="relative w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl z-10 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-orange-400">
                      {selectedOrder.orderNumber}
                    </span>
                    {String(selectedOrder.orderNumber).startsWith('DEMO-') && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-sans uppercase font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Demo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">
                    Placed: {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Type Overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Order Type
                  </span>
                  <div>{getTypeBadge(selectedOrder.orderType)}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Status
                  </span>
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        selectedOrder.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Workflow Notes */}
              {selectedOrder.orderType === 'request' && (
                <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white">Customer Request</strong>
                    Customer wants to talk first. Contact them to confirm parts, compatibility, and payment.
                  </div>
                </div>
              )}

              {selectedOrder.orderType === 'upi' && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 flex items-start gap-2.5">
                  <QrCode className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white">UPI Payment Verification</strong>
                    Verify the credit of ₹{Number(selectedOrder.total || 0).toLocaleString('en-IN')} in your bank or UPI app.
                    {selectedOrder.upiReference && (
                      <div className="mt-1 font-mono text-purple-200">
                        Provided UTR: <strong>{selectedOrder.upiReference}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Details & Quick Contact Links */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Customer &amp; Contact
                </span>

                <div className="text-xs space-y-1.5 text-zinc-300">
                  <div>
                    <span className="text-zinc-500">Name:</span>{' '}
                    <strong className="text-white">{selectedOrder.customerName || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">Email:</span>{' '}
                    <span className="font-mono text-zinc-200">{selectedOrder.customerEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Mobile:</span>{' '}
                    <span className="font-mono text-zinc-200">{selectedOrder.customerMobile || 'N/A'}</span>
                  </div>
                </div>

                {/* Quick Call & WhatsApp links */}
                {selectedOrder.customerMobile && (
                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={`https://wa.me/${selectedOrder.customerMobile.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Hi ${selectedOrder.customerName || ''}, regarding your AirTouch Engineering order ${selectedOrder.orderNumber}:`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={`tel:${selectedOrder.customerMobile}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors border border-zinc-700"
                    >
                      <Phone className="w-3.5 h-3.5 text-orange-400" />
                      <span>Call</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Shipping Address Snapshot */}
              {selectedOrder.shippingAddress && (
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs">
                  <span className="font-bold uppercase tracking-wider text-zinc-400">
                    Shipping Address
                  </span>
                  <p className="text-zinc-300 leading-relaxed">
                    {selectedOrder.shippingAddress.fullName && (
                      <strong className="text-white block">
                        {selectedOrder.shippingAddress.fullName}
                      </strong>
                    )}
                    {selectedOrder.shippingAddress.line1 || selectedOrder.shippingAddress.addressLine1}
                    {selectedOrder.shippingAddress.landmark && `, near ${selectedOrder.shippingAddress.landmark}`}
                    <br />
                    {selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.state} -{' '}
                    <span className="font-mono text-white">{selectedOrder.shippingAddress.pincode}</span>
                  </p>
                </div>
              )}

              {/* Items Manifest */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Ordered Components ({selectedOrder.items?.length || 0})
                </span>

                <div className="divide-y divide-zinc-850 rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 space-y-2">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-3">
                          <p className="font-semibold text-white truncate">{item.productName}</p>
                          <p className="text-[11px] text-zinc-500 font-mono">
                            {item.quantity}x @ ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="font-mono font-bold text-white shrink-0">
                          ₹{Number(item.lineTotal || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No item snapshots available</p>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">
                    ₹{Number(selectedOrder.subtotal || selectedOrder.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                {selectedOrder.platformFee > 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Platform Fee</span>
                    <span className="font-mono text-white">
                      ₹{selectedOrder.platformFee}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Delivery Charges</span>
                  <span className="font-mono text-white">
                    {selectedOrder.deliveryFee === 0 ? 'Free' : `₹${selectedOrder.deliveryFee || 0}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-bold text-white">
                  <span>Grand Total</span>
                  <span className="text-orange-400 font-mono">
                    ₹{Number(selectedOrder.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Footer Status Toggle & Invoice */}
            <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDownloadInvoice(selectedOrder)}
                disabled={downloadingInvoiceId === selectedOrder.id}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {downloadingInvoiceId === selectedOrder.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-orange-400" />
                )}
                <span>
                  {selectedOrder.status === 'completed'
                    ? 'Download invoice'
                    : 'Download invoice (pending)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleStatus(selectedOrder)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  selectedOrder.status === 'completed'
                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {selectedOrder.status === 'completed' ? 'Revert to Pending' : 'Mark Completed'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
