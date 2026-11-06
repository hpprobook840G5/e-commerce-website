const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function api(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg = data.message || `API error: ${response.status} ${response.statusText}`
    throw new ApiError(errorMsg, response.status, data)
  }

  return data
}

/**
 * Submit public customer inquiry to POST /api/contact
 */
export async function submitContactMessage(payload) {
  return api('/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Admin: List contact messages from GET /api/admin/contact-messages
 */
export async function getAdminContactMessages({ page = 1, limit = 10, status = '', topic = '' } = {}) {
  const params = new URLSearchParams()
  if (page) params.set('page', page)
  if (limit) params.set('limit', limit)
  if (status) params.set('status', status)
  if (topic) params.set('topic', topic)

  return api(`/admin/contact-messages?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  })
}

/**
 * Admin: Update contact message status via PATCH /api/admin/contact-messages/:id
 */
export async function updateAdminContactStatus(id, newStatus) {
  return api(`/admin/contact-messages/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    body: JSON.stringify({ status: newStatus }),
  })
}

export default api
