import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  Package,
  Calendar,
} from 'lucide-react'
import { getAdminContactMessages, updateAdminContactStatus } from '../../services/api.js'

const TOPIC_LABELS = {
  order_help: 'Order Help',
  product_fitment: 'Fitment Query',
  bulk_dealer: 'Bulk & Dealer',
  returns: 'Returns',
  other: 'General',
}

const STATUS_BADGES = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
}

export default function ContactMessagesTable() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionNotice, setActionNotice] = useState('')

  // Filter & Pagination state
  const [statusFilter, setStatusFilter] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 10

  // Expanded message IDs
  const [expandedIds, setExpandedIds] = useState(new Set())

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Fetch messages from backend
  const fetchMessages = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminContactMessages({
        page,
        limit,
        status: statusFilter,
        topic: topicFilter,
      })

      if (data.success) {
        setMessages(data.messages || [])
        setTotalPages(data.totalPages || 1)
        setTotalCount(data.total || 0)
      } else {
        setError(data.message || 'Failed to load contact messages.')
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve messages from server.')
    } finally {
      setLoading(false)
    }
  }, [page, limit, statusFilter, topicFilter])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Handle optimistic status change
  const handleStatusChange = async (id, newStatus) => {
    const previous = [...messages]

    // Optimistically update local state
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, status: newStatus } : msg))
    )
    setActionNotice('Updating status...')

    try {
      const res = await updateAdminContactStatus(id, newStatus)
      if (res.success) {
        setActionNotice('Status updated.')
        setTimeout(() => setActionNotice(''), 2500)
      } else {
        throw new Error(res.message || 'Update failed')
      }
    } catch (err) {
      // Rollback on failure
      setMessages(previous)
      setActionNotice('Failed to update status. Rolled back.')
      setTimeout(() => setActionNotice(''), 3500)
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <MessageSquare className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
              Customer Contact Inquiries
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Review, track, and update inquiries submitted through the Contact Us page.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              data-testid="admin-contact-status-filter"
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Topic Filter */}
          <div className="relative">
            <select
              value={topicFilter}
              onChange={(e) => {
                setTopicFilter(e.target.value)
                setPage(1)
              }}
              data-testid="admin-contact-topic-filter"
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="">All Topics</option>
              <option value="order_help">Order Help</option>
              <option value="product_fitment">Product Fitment</option>
              <option value="bulk_dealer">Bulk & Dealer</option>
              <option value="returns">Returns</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchMessages}
            disabled={loading}
            aria-label="Refresh list"
            title="Refresh Inquiries"
            className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Notice Banner */}
      {actionNotice && (
        <div className="mt-3 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs text-center font-medium">
          {actionNotice}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && messages.length === 0 ? (
        <div className="py-16 text-center text-zinc-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-3" />
          <p className="text-xs font-semibold uppercase tracking-wider">Loading inquiries...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="py-16 text-center text-zinc-500">
          <MessageSquare className="w-8 h-8 mx-auto text-zinc-600 mb-2 opacity-50" />
          <p className="text-sm font-semibold text-zinc-300">No inquiries found</p>
          <p className="text-xs text-zinc-500 mt-1">
            {statusFilter || topicFilter
              ? 'Try resetting the active filters above.'
              : 'New contact form submissions will appear here.'}
          </p>
        </div>
      ) : (
        <>
          {/* ================= DESKTOP / TABLET: TABLE VIEW ================= */}
          <div className="hidden md:block mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-950/40">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Topic</th>
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Message Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {messages.map((item) => {
                  const isExpanded = expandedIds.has(item.id)
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-950/50 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3 px-3 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(item.created_at)}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                        {item.name}
                      </td>

                      {/* Mobile & Email */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col font-mono text-[11px]">
                          <span className="text-zinc-200">{item.mobile}</span>
                          {item.email && (
                            <span className="text-zinc-500 text-[10px]">{item.email}</span>
                          )}
                        </div>
                      </td>

                      {/* Topic */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {TOPIC_LABELS[item.topic] || item.topic}
                        </span>
                      </td>

                      {/* Order ID */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-zinc-300">
                        {item.order_id ? (
                          <span className="text-orange-400 font-bold">{item.order_id}</span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          data-testid={`admin-status-select-${item.id}`}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            STATUS_BADGES[item.status] || STATUS_BADGES.new
                          } bg-zinc-950`}
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>

                      {/* Message Preview (Expandable) */}
                      <td className="py-3 px-3 max-w-xs">
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id)}
                          className="text-left cursor-pointer group flex items-start justify-between gap-2 w-full text-zinc-300 hover:text-white"
                        >
                          <p className={`text-xs ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {item.message}
                          </p>
                          <span className="text-zinc-500 group-hover:text-orange-400 shrink-0 mt-0.5">
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ================= MOBILE: STACKED CARDS VIEW (<768px) ================= */}
          <div className="md:hidden mt-4 space-y-3">
            {messages.map((item) => {
              const isExpanded = expandedIds.has(item.id)
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white text-sm">{item.name}</h3>
                      <p className="font-mono text-zinc-400 text-[11px] mt-0.5">{item.mobile}</p>
                      {item.email && (
                        <p className="text-zinc-500 text-[10px]">{item.email}</p>
                      )}
                    </div>
                    {/* Status dropdown */}
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                        STATUS_BADGES[item.status] || STATUS_BADGES.new
                      } bg-zinc-900`}
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span className="px-2 py-0.5 rounded font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {TOPIC_LABELS[item.topic] || item.topic}
                    </span>
                    {item.order_id && (
                      <span className="font-mono font-bold text-orange-400">
                        Order: {item.order_id}
                      </span>
                    )}
                    <span className="text-zinc-500 font-mono ml-auto">
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-zinc-900">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="w-full text-left flex items-start justify-between gap-2 text-zinc-300"
                    >
                      <p className={`text-xs ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {item.message}
                      </p>
                      <span className="text-zinc-500 shrink-0 mt-0.5">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ================= PAGINATION CONTROLS ================= */}
          <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Showing <strong className="text-white">{messages.length}</strong> of{' '}
              <strong className="text-white">{totalCount}</strong> submissions
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-850 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono text-xs">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                aria-label="Next page"
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-850 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

