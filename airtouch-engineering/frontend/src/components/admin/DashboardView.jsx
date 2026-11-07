import { useEffect, useState } from 'react'
import {
  IndianRupee,
  ShoppingBag,
  Package,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { fetchAnalyticsSummary, fetchContactMessages } from '../../services/adminApi.js'

export default function DashboardView({ onNavigateTab }) {
  const [summary, setSummary] = useState(null)
  const [latestMessages, setLatestMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sumRes, msgRes] = await Promise.all([
        fetchAnalyticsSummary().catch(() => null),
        fetchContactMessages({ page: 1, limit: 5 }).catch(() => null),
      ])

      if (sumRes) setSummary(sumRes)
      if (msgRes && Array.isArray(msgRes.messages)) {
        setLatestMessages(msgRes.messages.slice(0, 5))
      }
    } catch (err) {
      setError('Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
        <span className="text-xs uppercase tracking-widest font-mono">Loading Dashboard Metrics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Top Banner with Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Store Overview
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-time performance indicators and customer inquiry updates.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDashboardData}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              ₹{(summary?.totalRevenue || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              From {summary?.totalOrders || 0} completed transactions
            </p>
          </div>
        </div>

        {/* Orders Count */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Total Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {summary?.totalOrders || 0}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Avg value: ₹{(summary?.averageOrderValue || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Active Products */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Active Products
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {summary?.activeProducts || 0}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Live in storefront catalogue
            </p>
          </div>
        </div>

        {/* Unread Contact Messages */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Unread Messages
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {summary?.unreadMessages || 0}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Pending customer inquiries
            </p>
          </div>
        </div>
      </div>

      {/* Latest Contact Inquiries Section */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Recent Customer Inquiries
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Latest submissions received through the Contact Us page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('messages')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {latestMessages.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-850">
            No customer inquiries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Topic</th>
                  <th className="py-2.5 px-3">Message Snippet</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {latestMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-zinc-850/50 transition-colors">
                    <td className="py-3 px-3 text-zinc-400 font-mono whitespace-nowrap">
                      {new Date(msg.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </td>
                    <td className="py-3 px-3 font-medium text-white whitespace-nowrap">
                      {msg.name}
                    </td>
                    <td className="py-3 px-3 text-zinc-300 capitalize whitespace-nowrap">
                      {(msg.topic || 'general').replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 text-zinc-400 max-w-xs truncate">
                      {msg.message}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          msg.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : msg.status === 'in_progress'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        }`}
                      >
                        {msg.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => onNavigateTab('products')}
          className="p-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-800 text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 group-hover:text-orange-400 mb-2">
            <Package className="w-5 h-5" />
            <ArrowRight className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Catalog Management</h4>
          <p className="text-xs text-zinc-500 mt-1">Add, update pricing, stock, and upload images.</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('analytics')}
          className="p-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-800 text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 group-hover:text-orange-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <ArrowRight className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Sales Analytics</h4>
          <p className="text-xs text-zinc-500 mt-1">Visual charts for top products, categories, and trends.</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('messages')}
          className="p-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-850 border border-zinc-800 text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 group-hover:text-orange-400 mb-2">
            <MessageSquare className="w-5 h-5" />
            <ArrowRight className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Customer Inquiries</h4>
          <p className="text-xs text-zinc-500 mt-1">Review contact tickets and manage resolution states.</p>
        </button>
      </div>
    </div>
  )
}
