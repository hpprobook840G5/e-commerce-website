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
   * Helper to load completed orders and their corresponding line items.
   * Ensures that analytics only account for completed orders.
   */
  async getCompletedOrdersAndItems() {
    let orders = []
    let orderItems = []

    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data: dbOrders, error: oErr } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('status', 'completed')

        if (!oErr && dbOrders) {
          orders = dbOrders
          const completedOrderIds = dbOrders.map((o) => o.id)
          if (completedOrderIds.length > 0) {
            const { data: dbItems, error: iErr } = await supabaseAdmin
              .from('order_items')
              .select('*')
              .in('order_id', completedOrderIds)
            if (!iErr && dbItems) {
              orderItems = dbItems
            }
          }
        }
      } catch (err) {
        console.warn('[AnalyticsService] Orders DB query failed, using memory fallback:', err.message)
      }
    }

    if (orders.length === 0 && memoryOrders.length > 0) {
      orders = memoryOrders.filter((o) => o.status === 'completed')
      const completedOrderIds = new Set(orders.map((o) => o.id))
      orderItems = memoryOrderItems.filter((i) => completedOrderIds.has(i.order_id))
    }

    return { orders, orderItems }
  },

  /**
   * Summary KPI metrics for Dashboard and Analytics.
   * Includes ONLY orders with status 'completed'.
   */
  async getSummary() {
    const { orders, orderItems } = await this.getCompletedOrdersAndItems()

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
   * Top 10 products by revenue.
   * Includes ONLY orders with status 'completed'.
   */
  async getProductPerformance() {
    const { orderItems } = await this.getCompletedOrdersAndItems()

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
   * Category-wise revenue and volume breakdown.
   * Includes ONLY orders with status 'completed'.
   */
  async getCategoryPerformance() {
    const { orderItems } = await this.getCompletedOrdersAndItems()

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
   * Trend over selected range (7d, 30d, 12m).
   * Includes ONLY orders with status 'completed'.
   */
  async getRevenueTrend(range = '30d') {
    const { orders, orderItems } = await this.getCompletedOrdersAndItems()

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
   * List orders for Admin Orders page with filtering, search, and pagination.
   */
  async listOrders(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(params.limit, 10) || 20))
    const statusFilter = params.status && params.status !== 'all' ? params.status.toLowerCase() : null
    const typeFilter = params.orderType && params.orderType !== 'all' ? params.orderType.toLowerCase() : null
    const search = params.search ? String(params.search).trim().toLowerCase() : ''

    let allOrders = []
    let allOrderItems = []

    if (isAuthConfigured && supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })

        if (statusFilter) {
          query = query.eq('status', statusFilter)
        }
        if (typeFilter) {
          query = query.eq('order_type', typeFilter)
        }

        const { data: dbOrders, error: oErr } = await query
        const { data: dbItems, error: iErr } = await supabaseAdmin.from('order_items').select('*')

        if (!oErr && !iErr && dbOrders) {
          allOrders = dbOrders
          allOrderItems = dbItems || []
        }
      } catch (err) {
        console.warn('[AnalyticsService] Orders listing failed, using memory fallback:', err.message)
      }
    }

    if (allOrders.length === 0 && memoryOrders.length > 0) {
      allOrders = [...memoryOrders]
      allOrderItems = [...memoryOrderItems]
    }

    // Sort newest first
    allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    // Apply memory/fallback filters if needed
    let filteredOrders = allOrders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false
      if (typeFilter && (o.order_type || 'request') !== typeFilter) return false
      if (search) {
        const matchNum = String(o.order_number || '').toLowerCase().includes(search)
        const matchName = String(o.customer_name || '').toLowerCase().includes(search)
        const matchMobile = String(o.customer_mobile || '').toLowerCase().includes(search)
        const matchEmail = String(o.customer_email || '').toLowerCase().includes(search)
        if (!matchNum && !matchName && !matchMobile && !matchEmail) return false
      }
      return true
    })

    const total = filteredOrders.length
    const totalPages = Math.ceil(total / limit) || 1
    const offset = (page - 1) * limit
    const paginated = filteredOrders.slice(offset, offset + limit)

    const orders = paginated.map((o) => {
      const items = allOrderItems.filter((i) => i.order_id === o.id)
      return {
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name || 'Customer',
        customerMobile: o.customer_mobile || '',
        customerEmail: o.customer_email || '',
        orderType: o.order_type || 'request',
        status: o.status || 'pending',
        total: Math.round((Number(o.total_paise) || 0) / 100),
        subtotal: Math.round((Number(o.subtotal_paise || o.total_paise) || 0) / 100),
        platformFee: Math.round((Number(o.platform_fee_paise) || 0) / 100),
        deliveryFee: Math.round((Number(o.delivery_fee_paise) || 0) / 100),
        upiReference: o.upi_reference || null,
        shippingAddress: o.shipping_address || null,
        createdAt: o.created_at,
        completedAt: o.completed_at || null,
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

    return {
      orders,
      total,
      page,
      limit,
      totalPages,
    }
  },

  /**
   * Update order status (pending <-> completed)
   */
  async updateOrderStatus(orderId, status) {
    if (!['pending', 'completed'].includes(status)) {
      const err = new Error('Invalid status. Must be pending or completed.')
      err.status = 400
      throw err
    }

    const completedAt = status === 'completed' ? new Date().toISOString() : null
    let updatedOrder = null

    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .update({
            status,
            completed_at: completedAt,
          })
          .eq('id', orderId)
          .select()
          .maybeSingle()

        if (!error && data) {
          updatedOrder = data
        }
      } catch (err) {
        console.warn('[AnalyticsService] DB updateOrderStatus failed, using memory:', err.message)
      }
    }

    // Update in memory store
    const memOrder = memoryOrders.find((o) => o.id === orderId)
    if (memOrder) {
      memOrder.status = status
      memOrder.completed_at = completedAt
      if (!updatedOrder) updatedOrder = memOrder
    }

    if (!updatedOrder) {
      const err = new Error('Order not found.')
      err.status = 404
      throw err
    }

    const items = (
      isAuthConfigured && supabaseAdmin
        ? (await supabaseAdmin.from('order_items').select('*').eq('order_id', orderId)).data
        : null
    ) || memoryOrderItems.filter((i) => i.order_id === orderId) || []

    return {
      id: updatedOrder.id,
      orderNumber: updatedOrder.order_number,
      customerName: updatedOrder.customer_name,
      customerMobile: updatedOrder.customer_mobile,
      customerEmail: updatedOrder.customer_email,
      orderType: updatedOrder.order_type || 'request',
      status: updatedOrder.status,
      total: Math.round((Number(updatedOrder.total_paise) || 0) / 100),
      upiReference: updatedOrder.upi_reference || null,
      shippingAddress: updatedOrder.shipping_address || null,
      createdAt: updatedOrder.created_at,
      completedAt: updatedOrder.completed_at,
      items: items.map((i) => ({
        id: i.id,
        productName: i.product_name,
        category: i.category,
        unitPrice: Math.round((Number(i.unit_price_paise) || 0) / 100),
        quantity: i.quantity,
        lineTotal: Math.round((Number(i.line_total_paise) || 0) / 100),
      })),
    }
  },

  /**
   * Get counts of pending and completed orders for admin badges.
   */
  async getOrderCounts() {
    let pending = 0
    let completed = 0

    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { count: pCount, error: pErr } = await supabaseAdmin
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        const { count: cCount, error: cErr } = await supabaseAdmin
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')

        if (!pErr && !cErr && pCount !== null && cCount !== null && (pCount > 0 || cCount > 0)) {
          pending = pCount
          completed = cCount
          return { pending, completed }
        }
      } catch (err) {
        // fallback to memory
      }
    }

    for (const o of memoryOrders) {
      if (o.status === 'completed') completed++
      else pending++
    }

    return { pending, completed }
  },
}

export default salesAnalyticsService
