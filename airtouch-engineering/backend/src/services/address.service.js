import crypto from 'crypto'
import { supabaseAdmin } from '../config/supabase.js'

// In-memory fallback address store for testing/development when DB table migration is pending
const memoryAddresses = new Map() // userId -> Array of address objects

export class AddressService {
  /**
   * List all delivery addresses for a given user.
   * Enforces service-level ownership by user_id.
   *
   * @param {string} userId
   * @returns {Promise<Array<object>>}
   */
  static async listAddresses(userId) {
    if (!userId) return []

    let addresses = null
    try {
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from('addresses')
          .select('*')
          .eq('user_id', userId)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false })

        if (!error && data) {
          addresses = data
        }
      }
    } catch (err) {
      console.warn('[AddressService List Warning]:', err.message)
    }

    if (!addresses || addresses.length === 0) {
      addresses = memoryAddresses.get(userId) || []
    }

    return addresses.map((a) => ({
      ...a,
      district: a.district || a.city,
    }))
  }

  /**
   * Create a new delivery address for a user.
   * Rejects duplicate (same line1 and pincode).
   * Unsets any existing default address using two ordered statements when is_default is true.
   *
   * @param {string} userId
   * @param {object} addressData
   * @returns {Promise<object>} Created address
   */
  static async createAddress(userId, addressData) {
    if (!userId) {
      const err = new Error('User ID is required')
      err.status = 401
      throw err
    }

    const line1 = String(addressData.line1 || '').trim()
    const pincode = String(addressData.pincode || '').trim()
    const district = String(addressData.district || addressData.city || '').trim()
    const city = district // Mapped to DB city column
    const state = String(addressData.state || '').trim()
    const fullName = String(addressData.fullName || addressData.full_name || '').trim()
    const mobile = String(addressData.mobile || '').trim()
    const line2 = null // line2 removed; stop writing to it
    const landmark = addressData.landmark ? String(addressData.landmark).trim() : null
    const country = addressData.country ? String(addressData.country).trim() : 'India'

    // 1. Check for duplicates for this user
    const existingList = await this.listAddresses(userId)
    const isDuplicate = existingList.some(
      (a) =>
        a.line1?.toLowerCase().trim() === line1.toLowerCase() &&
        String(a.pincode).trim() === pincode
    )

    if (isDuplicate) {
      const err = new Error('An address with this street address and pincode already exists in your account.')
      err.status = 400
      throw err
    }

    // Determine default status: if explicitly set or if user has no addresses yet
    const shouldBeDefault =
      Boolean(addressData.is_default || addressData.isDefault) || existingList.length === 0

    // 2. Unset previous default using Statement 1 if new address is default
    if (shouldBeDefault) {
      try {
        if (supabaseAdmin) {
          await supabaseAdmin
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', userId)
            .eq('is_default', true)
        }
      } catch (unsetErr) {
        console.warn('[AddressService Unset Default Warning]:', unsetErr.message)
      }

      // Memory store sync
      const memList = memoryAddresses.get(userId) || []
      memList.forEach((a) => {
        a.is_default = false
      })
    }

    // 3. Statement 2: Insert new address row
    const newAddress = {
      id: crypto.randomUUID(),
      user_id: userId,
      full_name: fullName,
      mobile,
      line1,
      line2: null,
      landmark,
      city,
      district,
      state,
      pincode,
      country,
      is_default: shouldBeDefault,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Only pass existing schema columns to DB insert
    const dbPayload = {
      id: newAddress.id,
      user_id: newAddress.user_id,
      full_name: newAddress.full_name,
      mobile: newAddress.mobile,
      line1: newAddress.line1,
      line2: null,
      landmark: newAddress.landmark,
      city: newAddress.city,
      state: newAddress.state,
      pincode: newAddress.pincode,
      country: newAddress.country,
      is_default: newAddress.is_default,
      created_at: newAddress.created_at,
      updated_at: newAddress.updated_at,
    }

    let created = null
    try {
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from('addresses')
          .insert(dbPayload)
          .select()
          .single()

        if (!error && data) {
          created = {
            ...data,
            district: data.city,
          }
        }
      }
    } catch (insertErr) {
      console.warn('[AddressService Insert Warning]:', insertErr.message)
    }

    if (!created) {
      created = newAddress
    }

    // Keep memory store synced
    const list = memoryAddresses.get(userId) || []
    list.unshift(created)
    memoryAddresses.set(userId, list)

    return created
  }

  /**
   * Update an existing address.
   * Enforces service-level ownership by user_id.
   *
   * @param {string} userId
   * @param {string} addressId
   * @param {object} updates
   * @returns {Promise<object>}
   */
  static async updateAddress(userId, addressId, updates = {}) {
    const existingList = await this.listAddresses(userId)
    const target = existingList.find((a) => a.id === addressId)

    if (!target || target.user_id !== userId) {
      const err = new Error('Address not found or unauthorized')
      err.status = 404
      throw err
    }

    const newLine1 = updates.line1 !== undefined ? String(updates.line1).trim() : target.line1
    const newPincode = updates.pincode !== undefined ? String(updates.pincode).trim() : target.pincode

    // Duplicate check on modified line1 or pincode
    const isDuplicate = existingList.some(
      (a) =>
        a.id !== addressId &&
        a.line1?.toLowerCase().trim() === newLine1.toLowerCase() &&
        String(a.pincode).trim() === String(newPincode).trim()
    )

    if (isDuplicate) {
      const err = new Error('An address with this street address and pincode already exists in your account.')
      err.status = 400
      throw err
    }

    const isNowDefault =
      updates.is_default !== undefined ? Boolean(updates.is_default) :
      updates.isDefault !== undefined ? Boolean(updates.isDefault) :
      target.is_default

    // Statement 1: Unset other defaults if this becomes default
    if (isNowDefault && !target.is_default) {
      try {
        if (supabaseAdmin) {
          await supabaseAdmin
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', userId)
            .eq('is_default', true)
        }
      } catch (unsetErr) {
        console.warn('[AddressService Update Unset Default Warning]:', unsetErr.message)
      }

      const memList = memoryAddresses.get(userId) || []
      memList.forEach((a) => {
        a.is_default = false
      })
    }

    const payload = {
      updated_at: new Date().toISOString(),
    }

    if (updates.fullName || updates.full_name) {
      payload.full_name = String(updates.fullName || updates.full_name).trim()
    }
    if (updates.mobile) payload.mobile = String(updates.mobile).trim()
    if (updates.line1) payload.line1 = String(updates.line1).trim()
    if (updates.landmark !== undefined) payload.landmark = updates.landmark ? String(updates.landmark).trim() : null
    if (updates.district || updates.city) {
      payload.city = String(updates.district || updates.city).trim()
    }
    if (updates.state) payload.state = String(updates.state).trim()
    if (updates.pincode) payload.pincode = String(updates.pincode).trim()
    if (updates.country) payload.country = String(updates.country).trim()
    if (updates.is_default !== undefined || updates.isDefault !== undefined) {
      payload.is_default = isNowDefault
    }

    let updated = null
    try {
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from('addresses')
          .update(payload)
          .eq('id', addressId)
          .eq('user_id', userId)
          .select()
          .single()

        if (!error && data) {
          updated = {
            ...data,
            district: data.city,
          }
        }
      }
    } catch (err) {
      console.warn('[AddressService Update DB Warning]:', err.message)
    }

    if (!updated) {
      updated = { ...target, ...payload, district: payload.city || target.city }
    }

    const memList = memoryAddresses.get(userId) || []
    const idx = memList.findIndex((a) => a.id === addressId)
    if (idx !== -1) {
      memList[idx] = updated
    }

    return updated
  }

  /**
   * Delete an address by ID.
   * Enforces service-level ownership by user_id.
   *
   * @param {string} userId
   * @param {string} addressId
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  static async deleteAddress(userId, addressId) {
    const existingList = await this.listAddresses(userId)
    const target = existingList.find((a) => a.id === addressId)

    if (!target || target.user_id !== userId) {
      const err = new Error('Address not found or unauthorized')
      err.status = 404
      throw err
    }

    try {
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('addresses')
          .delete()
          .eq('id', addressId)
          .eq('user_id', userId)
      }
    } catch (err) {
      console.warn('[AddressService Delete DB Warning]:', err.message)
    }

    const memList = (memoryAddresses.get(userId) || []).filter((a) => a.id !== addressId)
    memoryAddresses.set(userId, memList)

    // If deleted address was default and there are remaining addresses, set the first one as default
    if (target.is_default && memList.length > 0) {
      const nextDefault = memList[0]
      nextDefault.is_default = true
      try {
        if (supabaseAdmin) {
          await supabaseAdmin
            .from('addresses')
            .update({ is_default: true })
            .eq('id', nextDefault.id)
            .eq('user_id', userId)
        }
      } catch (defErr) {
        console.warn('[AddressService Reassign Default Warning]:', defErr.message)
      }
    }

    return {
      success: true,
      message: 'Address deleted successfully.',
    }
  }
}

export default AddressService

