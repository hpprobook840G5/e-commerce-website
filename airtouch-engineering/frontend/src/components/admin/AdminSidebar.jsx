import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  TrendingUp,
  ShoppingBag,
  X,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { id: 'products', label: 'Products', icon: Package, path: '/admin/products' },
  { id: 'messages', label: 'Contact Messages', icon: MessageSquare, path: '/admin/messages' },
  { id: 'analytics', label: 'Sales Analytics', icon: TrendingUp, path: '/admin/analytics' },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
]

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  unreadCount = 0,
}) {
  const content = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide text-white uppercase block">
                AirTouch <span className="text-orange-500">Admin</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                Control Console
              </span>
            </div>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id)
                  if (onCloseMobile) onCloseMobile()
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                  isActive
                    ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'messages' && unreadCount > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                      isActive ? 'bg-black text-orange-400' : 'bg-orange-500 text-black'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer Storefront Link */}
      <div className="p-4 border-t border-zinc-800/80">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 transition-colors"
        >
          <span>View Public Store</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar (Fixed left) */}
      <aside className="hidden lg:block w-64 bg-zinc-950 border-r border-zinc-800/90 h-screen sticky top-0 shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop & Panel */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-zinc-950 border-r border-zinc-800 shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  )
}
