import customerSession from './customerSession.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Normalizes order response from backend, mapping snake_case or nested DB fields
 * to clean camelCase properties.
 *
 * @param {object} data
 * @returns {object}
 */
export function mapOrderResponse(data) {
  if (!data) return data

  const shipping = data.shippingAddress || data.shipping_address || {}
  const rawItems = data.items || data.order_items || []

  return {
    ...data,
    orderNumber: data.orderNumber || data.order_number,
    orderType: data.orderType || data.order_type || 'request',
    status: data.status || 'pending',
    customerName: data.customerName || data.customer_name || shipping.fullName || '',
    customerMobile: data.customerMobile || data.customer_mobile || shipping.mobile || '',
    customerEmail: data.customerEmail || data.customer_email || '',
    shippingAddress: {
      fullName: shipping.fullName || shipping.full_name || data.customerName || data.customer_name || '',
      mobile: shipping.mobile || data.customerMobile || data.customer_mobile || '',
      line1: shipping.line1 || shipping.addressLine1 || shipping.address_line_1 || '',
      landmark: shipping.landmark || null,
      district: shipping.district || shipping.city || '',
      state: shipping.state || '',
      pincode: shipping.pincode || shipping.postal_code || '',
      country: shipping.country || 'India',
    },
    totals: data.totals || {
      sellingTotal: data.subtotal_paise ? Math.round(data.subtotal_paise / 100) : 0,
      total: data.total_paise ? Math.round(data.total_paise / 100) : 0,
    },
    items: rawItems.map((item) => ({
      id: item.id,
      productId: item.productId || item.product_id,
      productName: item.productName || item.product_name || item.name || 'Product',
      category: item.category || 'General',
      unitPrice:
        item.unitPrice !== undefined
          ? item.unitPrice
          : item.unit_price_paise !== undefined
          ? Math.round(Number(item.unit_price_paise) / 100)
          : 0,
      quantity: Number(item.quantity) || 1,
      lineTotal:
        item.lineTotal !== undefined
          ? item.lineTotal
          : item.line_total_paise !== undefined
          ? Math.round(Number(item.line_total_paise) / 100)
          : (Number(item.unitPrice || 0) * (Number(item.quantity) || 1)),
    })),
  }
}

/**
 * Creates a new customer order.
 *
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function createCustomerOrder(payload) {
  const token = customerSession.getToken()
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(data.message || 'Failed to place order.')
    error.status = res.status
    error.code = data.code
    error.items = data.items
    error.total = data.total
    throw error
  }

  return mapOrderResponse(data)
}

/**
 * Retrieves orders for the logged-in customer.
 *
 * @param {object} [options]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @returns {Promise<{ orders: Array<object>, total: number, page: number, limit: number, totalPages: number }>}
 */
export async function fetchCustomerOrders({ page = 1, limit = 20 } = {}) {
  const token = customerSession.getToken()
  const params = new URLSearchParams()
  if (page) params.set('page', page)
  if (limit) params.set('limit', limit)

  const res = await fetch(`${API_BASE_URL}/orders?${params.toString()}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(data.message || 'Failed to retrieve orders.')
    error.status = res.status
    throw error
  }

  const rawOrders = Array.isArray(data) ? data : data.orders || []
  return {
    orders: rawOrders.map(mapOrderResponse),
    total: data.total !== undefined ? data.total : rawOrders.length,
    page: data.page || page,
    limit: data.limit || limit,
    totalPages: data.totalPages || 1,
  }
}

/**
 * Retrieves a customer order by order number.
 *
 * @param {string} orderNumber
 * @returns {Promise<object>}
 */
export async function fetchCustomerOrderByNumber(orderNumber) {
  const token = customerSession.getToken()
  const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderNumber)}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(data.message || 'Order not found.')
    error.status = res.status
    throw error
  }

  return mapOrderResponse(data)
}

/**
 * Downloads invoice PDF as a Blob.
 *
 * @param {string} orderNumber
 * @returns {Promise<Blob>}
 */
export async function downloadOrderInvoice(orderNumber) {
  const token = customerSession.getToken()
  const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderNumber)}/invoice.pdf`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const error = new Error(errorData.message || 'Failed to download invoice.')
    error.status = res.status
    throw error
  }

  return await res.blob()
}

/**
 * Submits a customer-provided UPI transaction reference ID.
 *
 * @param {string} orderNumber
 * @param {string} reference
 * @returns {Promise<object>}
 */
export async function submitCustomerUpiReference(orderNumber, reference) {
  const token = customerSession.getToken()
  const res = await fetch(
    `${API_BASE_URL}/orders/${encodeURIComponent(orderNumber)}/payment-reference`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reference }),
    }
  )

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(data.message || 'Failed to submit transaction reference.')
    error.status = res.status
    throw error
  }

  return data
}

export default {
  createCustomerOrder,
  fetchCustomerOrders,
  fetchCustomerOrderByNumber,
  downloadOrderInvoice,
  submitCustomerUpiReference,
}
