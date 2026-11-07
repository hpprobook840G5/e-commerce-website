import { Link } from 'react-router-dom'
import { Package, ShoppingBag, Clock } from 'lucide-react'

export default function Orders() {
  return (
    <div className="min-h-[75vh] bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              My Orders
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Track courier delivery, package dispatch status, and order history.
            </p>
          </div>
        </div>

        {/* Empty / Placeholder State */}
        <div className="mt-12 text-center py-16 px-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
            <Clock className="w-8 h-8 text-zinc-600" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">No Orders Found</h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
            You haven&apos;t placed any orders yet. Once you order components from our catalog, courier tracking and invoice history will appear here.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-orange-500/20"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
