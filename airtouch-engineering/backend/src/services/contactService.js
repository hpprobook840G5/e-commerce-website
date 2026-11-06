import crypto from 'crypto'
import supabase from '../config/supabase.js'
import env from '../config/env.js'

// In-memory fallback cache for development/testing when Supabase table is not yet migrated
const memoryStore = []

/**
 * Creates a salted SHA-256 hash of the client IP address.
 * Never stores or logs raw IP addresses.
 */
export function hashIp(ip = '') {
  const salt = env.CONTACT_IP_SALT || 'dev-contact-ip-salt-default'
  return crypto.createHash('sha256').update(String(ip) + salt).digest('hex')
}

/**
 * Strips HTML tags from input strings to prevent stored XSS.
 */
export function sanitizeText(str = '') {
  if (typeof str !== 'string') return ''
  return str.replace(/<[^>]*>/g, '').trim()
}

export const contactService = {
  /**
   * Inserts a new customer inquiry message into Supabase contact_messages table.
   */
  async createContactMessage({ name, mobile, email, topic, order_id, message, ip }) {
    const ip_hash = hashIp(ip)
    const sanitizedName = sanitizeText(name)
    const sanitizedMessage = sanitizeText(message)
    const sanitizedOrderId = order_id ? sanitizeText(order_id) : null
    const sanitizedEmail = email ? email.trim().toLowerCase() : null

    const payload = {
      name: sanitizedName,
      mobile: mobile.trim(),
      email: sanitizedEmail,
      topic,
      order_id: sanitizedOrderId,
      message: sanitizedMessage,
      status: 'new',
      ip_hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const isPlaceholder = !env.SUPABASE_URL || env.SUPABASE_URL.includes('placeholder')
    if (isPlaceholder) {
      const fallbackId = crypto.randomUUID()
      const fallbackRecord = { ...payload, id: fallbackId }
      memoryStore.unshift(fallbackRecord)
      return fallbackRecord
    }

    try {
      // 1. Attempt database insert via Supabase Service Role client
      const { data, error } = await supabase
        .from('contact_messages')
        .insert([payload])
        .select('id, created_at')
        .single()

      if (error) {
        console.warn('[ContactService] Supabase insert warning (fallback to memory store):', error.message)
        // Fallback for dev / un-migrated tables
        const fallbackId = crypto.randomUUID()
        const fallbackRecord = { ...payload, id: fallbackId }
        memoryStore.unshift(fallbackRecord)
        return fallbackRecord
      }

      // Keep memory store in sync for quick dev inspections
      memoryStore.unshift({ ...payload, id: data.id })
      return data
    } catch (err) {
      console.warn('[ContactService] Exception inserting to Supabase (using memory fallback):', err.message)
      const fallbackId = crypto.randomUUID()
      const fallbackRecord = { ...payload, id: fallbackId }
      memoryStore.unshift(fallbackRecord)
      return fallbackRecord
    }
  },

  /**
   * Retrieves paginated contact messages with optional filtering.
   */
  async getContactMessages({ page = 1, limit = 10, status, topic }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10))
    const offset = (pageNum - 1) * limitNum

    const isPlaceholder = !env.SUPABASE_URL || env.SUPABASE_URL.includes('placeholder')
    if (isPlaceholder) {
      return this.getFromMemoryStore({ page: pageNum, limit: limitNum, status, topic })
    }

    try {
      let query = supabase
        .from('contact_messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (status && ['new', 'in_progress', 'resolved'].includes(status)) {
        query = query.eq('status', status)
      }

      if (topic && ['order_help', 'product_fitment', 'bulk_dealer', 'returns', 'other'].includes(topic)) {
        query = query.eq('topic', topic)
      }

      query = query.range(offset, offset + limitNum - 1)

      const { data, count, error } = await query

      if (error || !data) {
        // Fallback to memory store if table is missing in local dev
        return this.getFromMemoryStore({ page: pageNum, limit: limitNum, status, topic })
      }

      return {
        messages: data,
        total: count || data.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((count || data.length) / limitNum) || 1,
      }
    } catch (err) {
      return this.getFromMemoryStore({ page: pageNum, limit: limitNum, status, topic })
    }
  },

  /**
   * Helper for in-memory retrieval during dev or testing.
   */
  getFromMemoryStore({ page, limit, status, topic }) {
    let filtered = [...memoryStore]
    if (status) {
      filtered = filtered.filter((m) => m.status === status)
    }
    if (topic) {
      filtered = filtered.filter((m) => m.topic === topic)
    }

    const total = filtered.length
    const offset = (page - 1) * limit
    const paged = filtered.slice(offset, offset + limit)

    return {
      messages: paged,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    }
  },

  /**
   * Updates message resolution status.
   */
  async updateMessageStatus(id, newStatus) {
    if (!['new', 'in_progress', 'resolved'].includes(newStatus)) {
      throw new Error('Invalid status. Allowed values: new, in_progress, resolved')
    }

    const updatedAt = new Date().toISOString()

    const isPlaceholder = !env.SUPABASE_URL || env.SUPABASE_URL.includes('placeholder')
    if (isPlaceholder) {
      const item = memoryStore.find((m) => m.id === id)
      if (item) {
        item.status = newStatus
        item.updated_at = updatedAt
        return item
      }
      return null
    }

    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus, updated_at: updatedAt })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) {
        // Update in memory fallback
        const item = memoryStore.find((m) => m.id === id)
        if (item) {
          item.status = newStatus
          item.updated_at = updatedAt
          return item
        }
        return null
      }

      // Update memory store copy if present
      const memItem = memoryStore.find((m) => m.id === id)
      if (memItem) {
        memItem.status = newStatus
        memItem.updated_at = updatedAt
      }

      return data
    } catch (err) {
      const item = memoryStore.find((m) => m.id === id)
      if (item) {
        item.status = newStatus
        item.updated_at = updatedAt
        return item
      }
      return null
    }
  },
}

export default contactService
