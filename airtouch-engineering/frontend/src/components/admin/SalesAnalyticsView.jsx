import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  IndianRupee,
  Package,
  Layers,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import {
  fetchAnalyticsSummary,
  fetchProductAnalytics,
  fetchCategoryAnalytics,
  fetchTrendAnalytics,
} from '../../services/adminApi.js'

const CATEGORY_COLORS = [
  '#f97316', // orange-500
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#eab308', // yellow-500
  '#a855f7', // purple-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
]

export default function SalesAnalyticsView() {
  const [range, setRange] = useState('30d') // '7d' | '30d' | '12m'
  const [summary, setSummary] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sumRes, prodRes, catRes, trendRes] = await Promise.all([
        fetchAnalyticsSummary().catch(() => null),
        fetchProductAnalytics().catch(() => ({ products: [] })),
        fetchCategoryAnalytics().catch(() => ({ categories: [] })),
        fetchTrendAnalytics(range).catch(() => ({ trend: [] })),
      ])

      if (sumRes) setSummary(sumRes)
      if (prodRes?.products) setTopProducts(prodRes.products)
      if (catRes?.categories) setCategories(catRes.categories)
      if (trendRes?.trend) setTrendData(trendRes.trend)
    } catch (err) {
      setError('Unable to load analytics metrics from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [range])

  const hasSalesData =
    (summary?.totalOrders > 0 || topProducts.length > 0 || categories.length > 0)

  return (
    <div className="space-y-8">
      {/* Header and Date Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Sales &amp; Revenue Analytics
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Real-time performance graphs, product sales volume, and category revenue distribution.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Range Buttons */}
          <div className="inline-flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 text-xs font-semibold">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '12m', label: '12 Months' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  range === r.id
                    ? 'bg-orange-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-4 h-4 text-orange-400" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
          <span className="text-xs font-mono uppercase tracking-widest">
            Compiling Sales Aggregations...
          </span>
        </div>
      ) : !hasSalesData ? (
        /* Empty State */
        <div className="py-20 px-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_24px_rgba(249,115,22,0.15)]">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold uppercase tracking-wider text-white">
            No Sales Data Recorded Yet
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            No sales yet. Orders will appear here once customers check out.
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            Dev hint: Run <code className="text-orange-400">node scripts/seed-dummy-sales.js --confirm</code> in backend to populate 30 days of realistic demo sales.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Total Revenue
              </span>
              <div className="text-3xl font-black text-white font-mono mt-2">
                ₹{(summary?.totalRevenue || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Gross sales from order items</p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Units Sold
              </span>
              <div className="text-3xl font-black text-white font-mono mt-2">
                {summary?.unitsSold || 0}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Components shipped across orders</p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Average Order Value
              </span>
              <div className="text-3xl font-black text-white font-mono mt-2">
                ₹{(summary?.averageOrderValue || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Average cart ticket size</p>
            </div>
          </div>

          {/* Chart 3: Revenue Trend Line Chart */}
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Revenue Over Time ({range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 12 Months'})
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Timeline of daily/monthly transaction revenue in rupees.
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    tickLine={{ stroke: '#3f3f46' }}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    tickLine={{ stroke: '#3f3f46' }}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#27272a',
                      borderRadius: '0.75rem',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ fill: '#f97316', r: 4 }}
                    activeDot={{ r: 6, fill: '#ea580c' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Accessibility Data Table Fallback */}
            <details className="text-xs text-zinc-400 mt-4 border-t border-zinc-800 pt-3">
              <summary className="cursor-pointer hover:text-white font-semibold uppercase tracking-wider text-[11px]">
                View Accessible Trend Table
              </summary>
              <div className="mt-3 max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="py-1 px-2">Date</th>
                      <th className="py-1 px-2 text-right">Orders</th>
                      <th className="py-1 px-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map((d, i) => (
                      <tr key={i} className="border-b border-zinc-850">
                        <td className="py-1 px-2">{d.date}</td>
                        <td className="py-1 px-2 text-right font-mono">{d.orders}</td>
                        <td className="py-1 px-2 text-right font-mono font-bold text-white">
                          ₹{d.revenue.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>

          {/* Grid: Chart 1 (Top Products) & Chart 2 (Category Breakdown) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Top 10 Products by Revenue (Horizontal Bar Chart) */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Top 10 Products by Revenue
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Best-performing motorcycle components ranked by gross earnings.
                </p>
              </div>

              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topProducts}
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#71717a"
                      tick={{ fontSize: 10, fill: '#a1a1aa' }}
                      tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#71717a"
                      tick={{ fontSize: 10, fill: '#d4d4d8' }}
                      width={120}
                      tickFormatter={(name) =>
                        name.length > 16 ? `${name.substring(0, 14)}...` : name
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                      formatter={(value, name, item) => [
                        `₹${Number(value).toLocaleString('en-IN')} (${item.payload.unitsSold} units)`,
                        'Revenue',
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#f97316" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Accessible Fallback Table */}
              <details className="text-xs text-zinc-400 border-t border-zinc-800 pt-3">
                <summary className="cursor-pointer hover:text-white font-semibold uppercase tracking-wider text-[11px]">
                  View Accessible Products Table
                </summary>
                <div className="mt-3 max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400">
                        <th className="py-1 px-2">Product Name</th>
                        <th className="py-1 px-2">Category</th>
                        <th className="py-1 px-2 text-right">Units</th>
                        <th className="py-1 px-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p, i) => (
                        <tr key={i} className="border-b border-zinc-850">
                          <td className="py-1 px-2 text-white font-medium">{p.name}</td>
                          <td className="py-1 px-2 capitalize">{p.category}</td>
                          <td className="py-1 px-2 text-right font-mono">{p.unitsSold}</td>
                          <td className="py-1 px-2 text-right font-mono font-bold text-orange-400">
                            ₹{p.revenue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>

            {/* Chart 2: Category-wise Distribution (Donut Chart) */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Category Revenue Share
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Proportional sales distribution across motorcycle hardware categories.
                </p>
              </div>

              <div className="h-80 w-full pt-2 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {categories.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                      formatter={(val, name, item) => [
                        `₹${Number(val).toLocaleString('en-IN')} (${item.payload.unitsSold} units)`,
                        name,
                      ]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(val) => <span className="text-xs text-zinc-300 font-medium">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Accessible Fallback Table */}
              <details className="text-xs text-zinc-400 border-t border-zinc-800 pt-3">
                <summary className="cursor-pointer hover:text-white font-semibold uppercase tracking-wider text-[11px]">
                  View Accessible Category Table
                </summary>
                <div className="mt-3">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400">
                        <th className="py-1 px-2">Category</th>
                        <th className="py-1 px-2 text-right">Units</th>
                        <th className="py-1 px-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c, i) => (
                        <tr key={i} className="border-b border-zinc-850">
                          <td className="py-1 px-2 text-white font-medium">{c.category}</td>
                          <td className="py-1 px-2 text-right font-mono">{c.unitsSold}</td>
                          <td className="py-1 px-2 text-right font-mono font-bold text-white">
                            ₹{c.revenue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
