import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  ShoppingBag,
  Clock,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Calendar,
  CreditCard,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react'
import { fetchCustomerOrders } from '../../services/orderApi.js'

function formatDate(isoStr) {
  if (!isoStr) return 'N/A'
  try {
    const d = new Date(isoStr)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return isoStr
  }
}

function OrderTypeBadge({ type }) {
  const normalized = (type || 'request').toLowerCase()
  if (normalized === 'upi') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
        <CreditCard className="w-3 h-3 text-purple-400 shrink-0" />
        <span>UPI</span>
      </span>
    )
  }
  if (normalized === 'cod') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
        <Package className="w-3 h-3 text-blue-400 shrink-0" />
        <span>COD</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
      <MessageSquare className="w-3 h-3 text-amber-400 shrink-0" />
      <span>Request</span>
    </span>
  )
}

function OrderStatusBadge({ status }) {
  const isCompleted = (status || '').toLowerCase() === 'completed'
  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
        <span>Completed</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
      <Clock className="w-3 h-3 text-yellow-400 shrink-0" />
      <span>Pending</span>
    </span>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCustomerOrders({ page: 1, limit: 50 })
      setOrders(data.orders || [])
    } catch (err) {
      console.error('[Orders] Failed to load orders:', err)
      setError(err.message || 'Unable to retrieve your order history.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  return (
    <div className="min-h-[75vh] bg-zinc-950 text-zinc-100 py-8 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white truncate">
                My Orders
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 truncate">
                Track courier delivery, package dispatch status, and order history.
              </p>
            </div>
          </div>

          {!loading && !error && orders.length > 0 && (
            <button
              type="button"
              onClick={loadOrders}
              aria-label="Refresh orders"
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-8 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-zinc-900/40 border border-zinc-800/80 p-4 sm:p-5 animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="h-4 bg-zinc-800 rounded w-1/3" />
                  <div className="h-5 bg-zinc-800 rounded w-1/4" />
                </div>
                <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                  <div className="h-5 bg-zinc-800 rounded w-1/5" />
                  <div className="h-7 bg-zinc-800 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="mt-12 text-center py-12 px-4 rounded-2xl bg-zinc-900/40 border border-rose-500/30">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1.5">Unable to Load Orders</h2>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
              {error}
            </p>
            <button
              type="button"
              onClick={loadOrders}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-lg shadow-orange-500/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && orders.length === 0 && (
          <div className="mt-12 text-center py-16 px-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
              <Clock className="w-8 h-8 text-zinc-600" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">No orders yet</h2>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
              You haven&apos;t placed any orders yet. Once you order components from our catalog, courier tracking and dispatch details will appear here.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-orange-500/20"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Products</span>
            </Link>
          </div>
        )}

        {/* Orders List */}
        {!loading && !error && orders.length > 0 && (
          <div className="mt-8 space-y-4">
            {orders.map((order) => {
              const itemCount =
                order.items?.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) ||
                order.items?.length ||
                1
              const firstItem = order.items?.[0]
              const firstItemTitle = firstItem?.productName || 'AirTouch Component'

              return (
                <div
                  key={order.orderNumber}
                  className="rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/90 transition-all p-4 sm:p-5 w-full min-w-0 flex flex-col justify-between gap-3 sm:gap-4 shadow-sm"
                >
                  {/* Top Bar: Order Number and Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-800/70 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-white text-sm sm:text-base tracking-wide truncate">
                        #{order.orderNumber}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <OrderTypeBadge type={order.orderType} />
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>

                  {/* Middle Content */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>Placed on {formatDate(order.createdAt)}</span>
                      </div>

                      <div
                        className="text-xs sm:text-sm font-semibold text-zinc-200 line-clamp-1 truncate"
                        title={firstItemTitle}
                      >
                        {firstItemTitle}
                        {order.items && order.items.length > 1 && (
                          <span className="text-zinc-500 font-normal">
                            {' '}
                            (+{order.items.length - 1} more)
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-zinc-500">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'} total
                      </div>
                    </div>

                    {/* Right / Bottom Action & Total */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                          Total
                        </span>
                        <span className="text-base sm:text-lg font-black text-orange-400">
                          ₹{Number(order.totals?.total || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <Link
                        to={`/order/${order.orderNumber}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 border border-orange-500/30 text-xs font-bold uppercase tracking-wider transition-colors min-h-[36px]"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
