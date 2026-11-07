import { useState, useEffect } from 'react'
import {
  ShoppingBag,
  Info,
  Calendar,
  User,
  IndianRupee,
  Package,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { fetchAdminOrders } from '../../services/adminApi.js'

export default function OrdersView() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAdminOrders()
      if (res?.orders) {
        setOrders(res.orders)
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Customer Orders ({orders.length})
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Database order receipts, item manifests, and customer transaction logs.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Checkout Development Notice */}
      <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-300 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-white block uppercase tracking-wider text-[11px] mb-0.5">
            Checkout Integration Status
          </span>
          Customer checkout pipeline is currently in development. The records below reflect live database
          orders, API test transactions, and developer seed data. Full payment gateway capture will integrate
          into this view.
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
          <span className="text-xs font-mono uppercase tracking-widest">Loading Orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center text-xs text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800 space-y-2">
          <p className="font-semibold text-zinc-400">No customer orders recorded yet.</p>
          <p className="text-[11px]">
            Dev hint: Run <code className="text-orange-400 font-mono">node scripts/seed-dummy-sales.js --confirm</code> to populate demo sales records.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table (hidden below 768px) */}
          <div className="hidden md:block rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider bg-zinc-950/60">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Email</th>
                  <th className="py-3 px-4">Components Ordered</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-850/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-orange-400 whitespace-nowrap">
                      {o.orderNumber || o.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-zinc-200">{o.customerEmail}</td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {o.items && o.items.length > 0 ? (
                          o.items.map((item, idx) => (
                            <div key={idx} className="text-zinc-300 text-[11px] flex items-center gap-1.5">
                              <span className="text-zinc-500 font-mono">{item.quantity}x</span>
                              <span className="truncate max-w-xs">{item.productName}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-zinc-500 italic">No item snapshots</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm whitespace-nowrap">
                      ₹{Number(o.total || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (below 768px) */}
          <div className="md:hidden space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-orange-400 text-xs">
                    {o.orderNumber || o.id.substring(0, 8)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {o.status}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-zinc-300">
                  <p className="text-zinc-400">{o.customerEmail}</p>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-850 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{o.itemCount || 1} items</span>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{Number(o.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
