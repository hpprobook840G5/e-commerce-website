const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Admin API Client
 * Uses credentials: 'include' for all requests to automatically send the httpOnly admin_token cookie.
 */

// ========================
// PRODUCTS MANAGEMENT
// ========================

export async function fetchAdminProducts({ page = 1, limit = 20, search = '', category = '', status = 'all' } = {}) {
  const params = new URLSearchParams()
  if (page) params.set('page', String(page))
  if (limit) params.set('limit', String(limit))
  if (search) params.set('search', search)
  if (category && category !== 'all') params.set('category', category)
  if (status && status !== 'all') params.set('status', status)

  const res = await fetch(`${API_BASE_URL}/admin/products?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to fetch products')
  }
  return res.json()
}

export async function createAdminProduct(productData) {
  const res = await fetch(`${API_BASE_URL}/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(productData),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || (err.errors && err.errors[0]?.msg) || 'Failed to create product')
  }
  return res.json()
}

export async function updateAdminProduct(id, updates) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || (err.errors && err.errors[0]?.msg) || 'Failed to update product')
  }
  return res.json()
}

export async function deleteAdminProduct(id) {
  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to delete product')
  }
  return res.json()
}

export async function uploadProductImage(id, file) {
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`${API_BASE_URL}/admin/products/${id}/image`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to upload image')
  }
  return res.json()
}

// ========================
// SALES ANALYTICS
// ========================

export async function fetchAnalyticsSummary() {
  const res = await fetch(`${API_BASE_URL}/admin/analytics/summary`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to fetch analytics summary')
  }
  return res.json()
}

export async function fetchProductAnalytics() {
  const res = await fetch(`${API_BASE_URL}/admin/analytics/products`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to fetch product analytics')
  }
  return res.json()
}

export async function fetchCategoryAnalytics() {
  const res = await fetch(`${API_BASE_URL}/admin/analytics/categories`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to fetch category analytics')
  }
  return res.json()
}

export async function fetchTrendAnalytics(range = '30d') {
  const res = await fetch(`${API_BASE_URL}/admin/analytics/trend?range=${encodeURIComponent(range)}`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to fetch revenue trend')
  }
  return res.json()
}

export async function fetchAdminOrders() {
  const res = await fetch(`${API_BASE_URL}/admin/orders`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to fetch orders')
  }
  return res.json()
}

// ========================
// CONTACT MESSAGES
// ========================

export async function fetchContactMessages({ page = 1, limit = 20, status = '', topic = '' } = {}) {
  const params = new URLSearchParams()
  if (page) params.set('page', String(page))
  if (limit) params.set('limit', String(limit))
  if (status && status !== 'all') params.set('status', status)
  if (topic && topic !== 'all') params.set('topic', topic)

  const res = await fetch(`${API_BASE_URL}/admin/contact-messages?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to fetch contact messages')
  }
  return res.json()
}

export async function updateContactMessageStatus(id, status) {
  const res = await fetch(`${API_BASE_URL}/admin/contact-messages/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to update message status')
  }
  return res.json()
}
