import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { supabaseAdmin, isAuthConfigured } from '../config/supabase.js'
import env from '../config/env.js'
import {
  PLATFORM_FEE_PAISE,
  DELIVERY_FEE_PAISE,
  FREE_DELIVERY_THRESHOLD_PAISE,
} from '../config/checkout.js'
import { notifyAdminNewOrder } from './orderNotification.service.js'
import salesAnalyticsService from './salesAnalytics.service.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const productsJsonPath = path.resolve(__dirname, '../../../frontend/src/data/products.json')

// Local product catalog cache from products.json
let localProductsCatalog = []
function loadLocalProductsCatalog() {
  if (localProductsCatalog.length > 0) return localProductsCatalog
  try {
    if (fs.existsSync(productsJsonPath)) {
      const data = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'))
      if (Array.isArray(data.products)) {
        localProductsCatalog = data.products
      }
    }
  } catch (err) {
    console.warn('[OrderService] Could not load local products.json:', err.message)
  }
  return localProductsCatalog
}

/**
 * Generate unique Order Number in format "ATE-yyMMddXXXX".
 * Never uses "DEMO-".
 */
export function generateOrderNumber() {
  const d = new Date()
  const yy = String(d.getFullYear()).slice(-2)
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let randomPart = ''
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(crypto.randomInt(chars.length))
  }
  return `ATE-${yy}${MM}${dd}${randomPart}`
}

export const orderService = {
  /**
   * Find product details by ID from Supabase or fallback catalog.
   */
  async getProductById(productId) {
    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('id', productId)
          .maybeSingle()

        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            category: data.category || 'General',
            pricePaise: Number(data.price_paise) || Math.round(Number(data.price || 0) * 100),
            mrpPaise:
              Number(data.mrp_paise) ||
              Math.round(Number(data.mrp || data.original_price || data.price || 0) * 100),
            stock: Number(data.stock ?? 99),
            isActive: data.is_active !== false,
          }
        }
      } catch (err) {
        // Fall back to local catalog
      }
    }

    const localList = loadLocalProductsCatalog()
    const found = localList.find((p) => p.id === productId)
    if (found) {
      const price = Number(found.price) || 0
      const mrp = Number(found.mrp || found.originalPrice || price)
      return {
        id: found.id,
        name: found.name,
        category: found.category || 'General',
        pricePaise: Math.round(price * 100),
        mrpPaise: Math.round(mrp * 100),
        stock: Number(found.stock ?? 99),
        isActive: found.isActive !== false,
      }
    }

    return null
  },

  /**
   * Create a new customer order.
   */
  async createOrder({ customerId, customerAuthEmail, orderData }) {
    const { orderType, items, address, expectedTotal, idempotencyKey } = orderData

    // 1. UPI validation
    if (orderType === 'upi' && !env.UPI_VPA) {
      const err = new Error('UPI payment is not configured.')
      err.status = 503
      throw err
    }

    // 2. Fetch customer details from user_details
    let customerName = address.fullName || 'Valued Customer'
    let customerMobile = address.mobile ? address.mobile.replace(/\D/g, '').slice(-10) : ''
    let customerEmail = customerAuthEmail || ''

    if (isAuthConfigured && supabaseAdmin && customerId) {
      try {
        const { data: userRec } = await supabaseAdmin
          .from('user_details')
          .select('full_name, mobile, email')
          .eq('id', customerId)
          .maybeSingle()

        if (userRec) {
          if (userRec.full_name) customerName = userRec.full_name
          if (userRec.mobile) customerMobile = userRec.mobile
          if (userRec.email) customerEmail = userRec.email
        }
      } catch (err) {
        // Ignore user_details fetch errors and use address details
      }
    }

    // 3. Idempotency Check: if customer already placed order with this key, return it
    if (idempotencyKey) {
      if (isAuthConfigured && supabaseAdmin) {
        try {
          const { data: existingOrder } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle()

          if (existingOrder) {
            return {
              isDuplicate: true,
              order: this.formatOrderResponse(existingOrder),
            }
          }
        } catch {
          // ignore
        }
      }

      // Check memory store for duplicate key
      const memExisting = salesAnalyticsService
        .getMemoryOrders()
        .find((o) => o.idempotency_key === idempotencyKey)
      if (memExisting) {
        return {
          isDuplicate: true,
          order: this.formatOrderResponse(memExisting),
        }
      }
    }

    // 4. Validate items against database/catalog and calculate totals in paise
    const unavailableItems = []
    let sellingTotalPaise = 0
    let mrpTotalPaise = 0
    const resolvedItems = []

    for (const item of items) {
      const product = await this.getProductById(item.productId)
      const qty = Math.max(1, Number(item.quantity) || 1)

      if (!product || !product.isActive || product.stock < qty) {
        unavailableItems.push(product ? product.name : `Product ID ${item.productId}`)
        continue
      }

      const lineSellingPaise = product.pricePaise * qty
      const lineMrpPaise = product.mrpPaise * qty

      sellingTotalPaise += lineSellingPaise
      mrpTotalPaise += lineMrpPaise

      resolvedItems.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        unitPricePaise: product.pricePaise,
        quantity: qty,
        lineTotalPaise: lineSellingPaise,
      })
    }

    if (unavailableItems.length > 0) {
      const err = new Error('Some items in your cart are no longer available.')
      err.status = 409
      err.code = 'ITEM_UNAVAILABLE'
      err.items = unavailableItems
      throw err
    }

    // Platform fee & Delivery fee in paise
    const platformFeePaise = sellingTotalPaise > 0 ? PLATFORM_FEE_PAISE : 0
    const deliveryFeePaise =
      sellingTotalPaise >= FREE_DELIVERY_THRESHOLD_PAISE || sellingTotalPaise === 0
        ? 0
        : DELIVERY_FEE_PAISE

    const totalPaise = sellingTotalPaise + platformFeePaise + deliveryFeePaise
    const serverTotalRupees = Math.round(totalPaise / 100)

    // Check expectedTotal against server calculated total
    if (Math.round(Number(expectedTotal) * 100) !== totalPaise) {
      const err = new Error('Order total has changed.')
      err.status = 409
      err.code = 'PRICE_CHANGED'
      err.total = serverTotalRupees
      throw err
    }

    // 5. Generate Order Number & record order
    const orderNumber = generateOrderNumber()
    const nowIso = new Date().toISOString()
    const orderId = crypto.randomUUID()

    const discountPaise = Math.max(0, mrpTotalPaise - sellingTotalPaise)

    const normalizedMobile = customerMobile.startsWith('+91')
      ? customerMobile
      : `+91${customerMobile.replace(/\D/g, '').slice(-10)}`

    const orderRow = {
      id: orderId,
      order_number: orderNumber,
      order_type: orderType,
      customer_id: customerId || null,
      customer_name: customerName,
      customer_mobile: normalizedMobile,
      customer_email: customerEmail,
      shipping_address: {
        fullName: address.fullName,
        mobile: normalizedMobile,
        line1: address.addressLine1 || address.line1,
        landmark: address.landmark || null,
        district: address.district,
        state: address.state,
        pincode: address.pincode,
        country: 'India',
      },
      subtotal_paise: sellingTotalPaise,
      mrp_total_paise: mrpTotalPaise,
      platform_fee_paise: platformFeePaise,
      delivery_fee_paise: deliveryFeePaise,
      total_paise: totalPaise,
      status: 'pending',
      created_at: nowIso,
      completed_at: null,
      admin_notified_at: null,
      idempotency_key: idempotencyKey || null,
    }

    const orderItemRows = resolvedItems.map((item) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: item.productId,
      product_name: item.productName,
      category: item.category,
      unit_price_paise: item.unitPricePaise,
      quantity: item.quantity,
      line_total_paise: item.lineTotalPaise,
    }))

    // Insert into database if configured
    let dbInsertSuccess = false
    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { error: oErr } = await supabaseAdmin.from('orders').insert([orderRow])
        if (!oErr) {
          const { error: iErr } = await supabaseAdmin.from('order_items').insert(orderItemRows)
          if (iErr) {
            // Rollback order row if items fail
            await supabaseAdmin.from('orders').delete().eq('id', orderId)
            throw new Error(iErr.message)
          }
          dbInsertSuccess = true
        }
      } catch (err) {
        console.warn('[OrderService] Supabase insert failed, persisting to memory fallback:', err.message)
      }
    }

    // Always update memory store for consistent admin & analytics availability
    const existingMemoryOrders = salesAnalyticsService.getMemoryOrders()
    const existingMemoryItems = salesAnalyticsService.getMemoryOrderItems()
    salesAnalyticsService.setMemoryData(
      [orderRow, ...existingMemoryOrders],
      [...orderItemRows, ...existingMemoryItems]
    )

    // Build Totals object in Rupees
    const totalsInRupees = {
      sellingTotal: Math.round(sellingTotalPaise / 100),
      mrpTotal: Math.round(mrpTotalPaise / 100),
      discount: Math.round(discountPaise / 100),
      platformFee: Math.round(platformFeePaise / 100),
      deliveryFee: Math.round(deliveryFeePaise / 100),
      total: serverTotalRupees,
    }

    // Build UPI link if order type is "upi"
    let upiDetails = null
    if (orderType === 'upi' && env.UPI_VPA) {
      const payee = env.UPI_PAYEE_NAME || 'AirTouch Engineering'
      const amountStr = (totalPaise / 100).toFixed(2)
      const upiLink = `upi://pay?pa=${env.UPI_VPA}&pn=${encodeURIComponent(
        payee
      )}&am=${amountStr}&cu=INR&tn=${orderNumber}`

      upiDetails = {
        link: upiLink,
        payeeName: payee,
        vpa: env.UPI_VPA,
      }
    }

    // Non-blocking Admin Notification
    notifyAdminNewOrder({
      orderNumber,
      orderType,
      customerName,
      customerMobile: normalizedMobile,
      customerEmail,
      totals: totalsInRupees,
      items: resolvedItems,
      shippingAddress: orderRow.shipping_address,
    }).then(async (notifRes) => {
      if (notifRes?.success && notifRes.notifiedAt) {
        orderRow.admin_notified_at = notifRes.notifiedAt
        if (dbInsertSuccess && supabaseAdmin) {
          try {
            await supabaseAdmin
              .from('orders')
              .update({ admin_notified_at: notifRes.notifiedAt })
              .eq('id', orderId)
          } catch {}
        }
      }
    })

    return {
      orderNumber,
      status: 'pending',
      orderType,
      totals: totalsInRupees,
      createdAt: nowIso,
      ...(upiDetails ? { upi: upiDetails } : {}),
    }
  },

  /**
   * Find an order by order number for a specific authenticated customer.
   */
  async getOrderByNumberForCustomer(orderNumber, customerId) {
    let order = null
    let items = []

    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data: dbOrder, error } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .maybeSingle()

        if (!error && dbOrder) {
          order = dbOrder
          const { data: dbItems } = await supabaseAdmin
            .from('order_items')
            .select('*')
            .eq('order_id', dbOrder.id)
          items = dbItems || []
        }
      } catch (err) {
        // fallback to memory
      }
    }

    if (!order) {
      order = salesAnalyticsService.getMemoryOrders().find((o) => o.order_number === orderNumber)
      if (order) {
        items = salesAnalyticsService
          .getMemoryOrderItems()
          .filter((i) => i.order_id === order.id)
      }
    }

    if (!order) return null

    // Enforce ownership: must belong to authenticated customer, otherwise return null (404, never 403)
    if (order.customer_id && customerId && order.customer_id !== customerId) {
      return null
    }

    return this.formatOrderResponse(order, items)
  },

  /**
   * Submit UPI payment reference.
   */
  async submitPaymentReference({ orderNumber, customerId, reference }) {
    let order = null

    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .maybeSingle()
        if (!error && data) {
          order = data
        }
      } catch {}
    }

    if (!order) {
      order = salesAnalyticsService.getMemoryOrders().find((o) => o.order_number === orderNumber)
    }

    if (!order) {
      const err = new Error('Order not found')
      err.status = 404
      throw err
    }

    // Owner check
    if (order.customer_id && customerId && order.customer_id !== customerId) {
      const err = new Error('Order not found')
      err.status = 404
      throw err
    }

    // Only upi and pending orders can record reference
    if (order.order_type !== 'upi') {
      const err = new Error('Payment reference is only applicable to UPI orders.')
      err.status = 400
      throw err
    }

    if (order.status !== 'pending') {
      const err = new Error('Payment reference can only be added to pending orders.')
      err.status = 400
      throw err
    }

    // Update in Supabase
    if (isAuthConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('orders')
          .update({ upi_reference: reference })
          .eq('id', order.id)
      } catch {}
    }

    // Update in Memory
    order.upi_reference = reference

    return { success: true, message: 'Payment reference recorded.' }
  },

  /**
   * Helper to format order database row to API response shape.
   */
  formatOrderResponse(orderRow, orderItems = []) {
    const totalPaise = Number(orderRow.total_paise) || 0
    const sellingPaise = Number(orderRow.subtotal_paise) || totalPaise
    const mrpPaise = Number(orderRow.mrp_total_paise) || sellingPaise
    const platformFeePaise = Number(orderRow.platform_fee_paise) || 0
    const deliveryFeePaise = Number(orderRow.delivery_fee_paise) || 0

    const totals = {
      sellingTotal: Math.round(sellingPaise / 100),
      mrpTotal: Math.round(mrpPaise / 100),
      discount: Math.round(Math.max(0, mrpPaise - sellingPaise) / 100),
      platformFee: Math.round(platformFeePaise / 100),
      deliveryFee: Math.round(deliveryFeePaise / 100),
      total: Math.round(totalPaise / 100),
    }

    let upi = null
    if (orderRow.order_type === 'upi' && env.UPI_VPA) {
      const payee = env.UPI_PAYEE_NAME || 'AirTouch Engineering'
      const amountStr = (totalPaise / 100).toFixed(2)
      upi = {
        link: `upi://pay?pa=${env.UPI_VPA}&pn=${encodeURIComponent(
          payee
        )}&am=${amountStr}&cu=INR&tn=${orderRow.order_number}`,
        payeeName: payee,
        vpa: env.UPI_VPA,
      }
    }

    return {
      orderNumber: orderRow.order_number,
      status: orderRow.status,
      orderType: orderRow.order_type || 'request',
      customerName: orderRow.customer_name,
      customerMobile: orderRow.customer_mobile,
      customerEmail: orderRow.customer_email,
      shippingAddress: orderRow.shipping_address,
      totals,
      upiReference: orderRow.upi_reference || null,
      createdAt: orderRow.created_at,
      completedAt: orderRow.completed_at || null,
      items: orderItems.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        category: item.category,
        unitPrice: Math.round((Number(item.unit_price_paise) || 0) / 100),
        quantity: item.quantity,
        lineTotal: Math.round((Number(item.line_total_paise) || 0) / 100),
      })),
      ...(upi ? { upi } : {}),
    }
  },
}

export default orderService
