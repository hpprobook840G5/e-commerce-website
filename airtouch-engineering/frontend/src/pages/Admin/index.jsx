import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext.jsx'
import AdminSidebar from '../../components/admin/AdminSidebar.jsx'
import AdminHeader from '../../components/admin/AdminHeader.jsx'
import DashboardView from '../../components/admin/DashboardView.jsx'
import ProductsView from '../../components/admin/ProductsView.jsx'
import ContactMessagesTable from '../../components/admin/ContactMessagesTable.jsx'
import SalesAnalyticsView from '../../components/admin/SalesAnalyticsView.jsx'
import OrdersView from '../../components/admin/OrdersView.jsx'

export default function Admin() {
  const { admin, logoutAdmin } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Map current pathname to tab id
  const getTabFromPath = () => {
    const path = location.pathname.replace(/\/+$/, '')
    if (path === '/admin/products') return 'products'
    if (path === '/admin/messages') return 'messages'
    if (path === '/admin/analytics') return 'analytics'
    if (path === '/admin/orders') return 'orders'
    return 'dashboard'
  }

  const [activeTab, setActiveTab] = useState(getTabFromPath)

  // Sync tab with route changes
  useEffect(() => {
    setActiveTab(getTabFromPath())
  }, [location.pathname])

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId)
    if (tabId === 'dashboard') {
      navigate('/admin')
    } else {
      navigate(`/admin/${tabId}`)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logoutAdmin()
      navigate('/admin/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  const tabTitles = {
    dashboard: 'Admin Dashboard',
    products: 'Products & Inventory',
    messages: 'Customer Inquiries',
    analytics: 'Sales Analytics',
    orders: 'Orders Management',
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col lg:flex-row selection:bg-orange-500 selection:text-black">
      {/* Sidebar (Desktop sticky + Mobile slide-over) */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <AdminHeader
          title={tabTitles[activeTab] || 'Admin Console'}
          adminEmail={admin?.email}
          onOpenMobile={() => setIsMobileMenuOpen(true)}
          onLogout={handleLogout}
          isLoggingOut={loggingOut}
        />

        {/* View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardView onNavigateTab={handleSelectTab} />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <ContactMessagesTable />
            </div>
          )}
          {activeTab === 'analytics' && <SalesAnalyticsView />}
          {activeTab === 'orders' && <OrdersView />}
        </main>
      </div>
    </div>
  )
}
