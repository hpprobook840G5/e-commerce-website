import { supabaseAdmin, isAuthConfigured } from '../config/supabase.js'
import productService from './product.service.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const demoSalesPath = path.resolve(__dirname, '../data/demo_sales.json')

// In-memory orders store when Supabase tables are pending migration or for dev seeds
let memoryOrders = []
let memoryOrderItems = []

function loadDemoSalesIfNeeded() {
  if (memoryOrders.length > 0) return
  try {
    if (fs.existsSync(demoSalesPath)) {
      const raw = fs.readFileSync(demoSalesPath, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.orders)) {
        memoryOrders = parsed.orders
        memoryOrderItems = parsed.order_items || []
      }
    }
  } catch (err) {
    // ignore
  }
}

loadDemoSalesIfNeeded()

export const salesAnalyticsService = {
  // Store management for demo data & memory fallback
  getMemoryOrders() {
    return memoryOrders
  },
  getMemoryOrderItems() {
    return memoryOrderItems
  },
  setMemoryData(orders, items) {
    memoryOrders = orders
    memoryOrderItems = items
  },
  clearDemoData() {
    memoryOrders = memoryOrders.filter((o) => !o.order_number?.startsWith('DEMO-'))
    const remainingIds = new Set(memoryOrders.map((o) => o.id))
    memoryOrderItems = memoryOrderItems.filter((item) => remainingIds.has(item.order_id))
    try {
      if (fs.existsSync(demoSalesPath)) {
        fs.unlinkSync(demoSalesPath)
      }
    } catch {}
  },

  /**
   * Summary KPI metrics for Dashboard and Analytics
   */
  async getSummary() {
    let orders = []
    let orderItems = []

    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data: dbOrders, error: oErr } = await supabaseAdmin.from('orders').select('*')
        const { data: dbItems, error: iErr } = await supabaseAdmin.from('order_items').select('*')

        if (!oErr && !iErr && dbOrders) {
          orders = dbOrders
          orderItems = dbItems || []
        }
      } catch (err) {
        console.warn('[AnalyticsService] Orders DB query failed, using memory fallback:', err.message)
      }
    }

    if (orders.length === 0 && memoryOrders.length > 0) {
      orders = memoryOrders
      orderItems = memoryOrderItems
    }

    // Active products count
    let activeProductsCount = 0
    try {
      const prodRes = await productService.listAdminProducts({ status: 'active', limit: 1 })
      activeProductsCount = prodRes.total || 0
    } catch {
      activeProductsCount = 24
    }

    // Unread contact messages count
    let unreadMessagesCount = 0
    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { count, error } = await supabaseAdmin
          .from('contact_messages')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'new')
        if (!error && count !== null) {
          unreadMessagesCount = count
        }
      } catch {
        unreadMessagesCount = 0
      }
    }

    const totalRevenuePaise = orderItems.reduce((acc, item) => acc + (Number(item.line_total_paise) || 0), 0)
    const totalRevenue = Math.round(totalRevenuePaise / 100)
    const totalOrders = orders.length
    const unitsSold = orderItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

    return {
      totalRevenue,
      totalOrders,
      activeProducts: activeProductsCount,
      unreadMessages: unreadMessagesCount,
      unitsSold,
      averageOrderValue,
    }
  },

  /**
   * Top 10 products by revenue
   */
  async getProductPerformance() {
    let orderItems = []

    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from('order_items').select('*')
        if (!error && data) {
          orderItems = data
        }
      } catch (err) {
        console.warn('[AnalyticsService] Items query failed, using memory fallback:', err.message)
      }
    }

    if (orderItems.length === 0 && memoryOrderItems.length > 0) {
      orderItems = memoryOrderItems
    }

    const productMap = new Map()

    for (const item of orderItems) {
      const name = item.product_name || 'AirTouch Component'
      const existing = productMap.get(name) || {
        name,
        category: item.category || 'General',
        revenuePaise: 0,
        unitsSold: 0,
      }
      existing.revenuePaise += Number(item.line_total_paise) || 0
      existing.unitsSold += Number(item.quantity) || 0
      productMap.set(name, existing)
    }

    const sorted = Array.from(productMap.values())
      .map((p) => ({
        name: p.name,
        category: p.category,
        revenue: Math.round(p.revenuePaise / 100),
        unitsSold: p.unitsSold,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    return sorted
  },

  /**
   * Category-wise revenue and volume breakdown
   */
  async getCategoryPerformance() {
    let orderItems = []

    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from('order_items').select('*')
        if (!error && data) {
          orderItems = data
        }
      } catch (err) {
        console.warn('[AnalyticsService] Category query failed, using memory fallback:', err.message)
      }
    }

    if (orderItems.length === 0 && memoryOrderItems.length > 0) {
      orderItems = memoryOrderItems
    }

    const catMap = new Map()

    for (const item of orderItems) {
      const category = (item.category || 'brakes').toLowerCase()
      const existing = catMap.get(category) || {
        category,
        revenuePaise: 0,
        unitsSold: 0,
        count: 0,
      }
      existing.revenuePaise += Number(item.line_total_paise) || 0
      existing.unitsSold += Number(item.quantity) || 0
      existing.count += 1
      catMap.set(category, existing)
    }

    const results = Array.from(catMap.values())
      .map((c) => ({
        category: c.category.charAt(0).toUpperCase() + c.category.slice(1),
        revenue: Math.round(c.revenuePaise / 100),
        unitsSold: c.unitsSold,
        count: c.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    return results
  },

  /**
   * Trend over selected range (7d, 30d, 12m)
   */
  async getRevenueTrend(range = '30d') {
    let orders = []
    let orderItems = []

    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data: dbOrders, error: oErr } = await supabaseAdmin.from('orders').select('*')
        const { data: dbItems, error: iErr } = await supabaseAdmin.from('order_items').select('*')

        if (!oErr && !iErr && dbOrders) {
          orders = dbOrders
          orderItems = dbItems || []
        }
      } catch (err) {
        console.warn('[AnalyticsService] Trend query failed, using memory fallback:', err.message)
      }
    }

    if (orders.length === 0 && memoryOrders.length > 0) {
      orders = memoryOrders
      orderItems = memoryOrderItems
    }

    const now = new Date()
    let daysToBack = 30
    if (range === '7d') daysToBack = 7
    if (range === '12m') daysToBack = 365

    const cutoff = new Date(now.getTime() - daysToBack * 24 * 60 * 60 * 1000)

    // Filter orders by cutoff
    const validOrders = orders.filter((o) => new Date(o.created_at) >= cutoff)
    const validOrderIds = new Set(validOrders.map((o) => o.id))
    const validItems = orderItems.filter((i) => validOrderIds.has(i.order_id))

    // Build day map
    const trendMap = new Map()

    if (range === '12m') {
      // Monthly grouping
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
        trendMap.set(key, { date: key, revenue: 0, orders: 0 })
      }

      for (const item of validItems) {
        const order = validOrders.find((o) => o.id === item.order_id)
        if (!order) continue
        const d = new Date(order.created_at)
        const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
        if (trendMap.has(key)) {
          trendMap.get(key).revenue += Math.round((Number(item.line_total_paise) || 0) / 100)
        }
      }

      for (const order of validOrders) {
        const d = new Date(order.created_at)
        const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
        if (trendMap.has(key)) {
          trendMap.get(key).orders += 1
        }
      }
    } else {
      // Daily grouping
      for (let i = daysToBack - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const key = d.toISOString().split('T')[0]
        const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
        trendMap.set(key, { date: label, rawDate: key, revenue: 0, orders: 0 })
      }

      for (const item of validItems) {
        const order = validOrders.find((o) => o.id === item.order_id)
        if (!order) continue
        const key = new Date(order.created_at).toISOString().split('T')[0]
        if (trendMap.has(key)) {
          trendMap.get(key).revenue += Math.round((Number(item.line_total_paise) || 0) / 100)
        }
      }

      for (const order of validOrders) {
        const key = new Date(order.created_at).toISOString().split('T')[0]
        if (trendMap.has(key)) {
          trendMap.get(key).orders += 1
        }
      }
    }

    return Array.from(trendMap.values())
  },

  /**
   * List orders for Admin Orders page
   */
  async listOrders() {
    let orders = []
    let orderItems = []

    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data: dbOrders, error: oErr } = await supabaseAdmin
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
        const { data: dbItems, error: iErr } = await supabaseAdmin.from('order_items').select('*')

        if (!oErr && !iErr && dbOrders) {
          orders = dbOrders
          orderItems = dbItems || []
        }
      } catch (err) {
        console.warn('[AnalyticsService] Orders listing failed, using memory fallback:', err.message)
      }
    }

    if (orders.length === 0 && memoryOrders.length > 0) {
      orders = memoryOrders
      orderItems = memoryOrderItems
    }

    return orders.map((o) => {
      const items = orderItems.filter((i) => i.order_id === o.id)
      return {
        id: o.id,
        orderNumber: o.order_number,
        customerEmail: o.customer_email,
        total: Math.round((Number(o.total_paise) || 0) / 100),
        status: o.status || 'completed',
        createdAt: o.created_at,
        itemCount: items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0),
        items: items.map((i) => ({
          id: i.id,
          productName: i.product_name,
          category: i.category,
          unitPrice: Math.round((Number(i.unit_price_paise) || 0) / 100),
          quantity: i.quantity,
          lineTotal: Math.round((Number(i.line_total_paise) || 0) / 100),
        })),
      }
    })
  },
}

export default salesAnalyticsService
