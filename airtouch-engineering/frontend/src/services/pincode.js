import { indiaStates } from '../data/indiaStates.js'
import { indiaDistricts } from '../data/indiaDistricts.js'

const pincodeCache = new Map()

/**
 * Finds canonical State name in indiaStates.
 * Case-insensitive, handles standard aliases/ampersands.
 *
 * @param {string} rawState
 * @returns {string|null}
 */
export function findCanonicalState(rawState) {
  if (!rawState || typeof rawState !== 'string') return null
  const clean = rawState.trim().toLowerCase().replace(/\s*&\s*/g, ' and ')
  const found = indiaStates.find(
    (s) =>
      s.name.toLowerCase().replace(/\s*&\s*/g, ' and ') === clean ||
      s.code.toLowerCase() === clean
  )
  return found ? found.name : null
}

/**
 * Finds canonical District name in indiaDistricts for a given state.
 *
 * @param {string} stateName
 * @param {string} rawDistrict
 * @returns {string|null}
 */
export function findCanonicalDistrict(stateName, rawDistrict) {
  if (!stateName || !rawDistrict || !indiaDistricts[stateName]) return null
  const cleanDist = rawDistrict.trim().toLowerCase()
  const list = indiaDistricts[stateName]

  // 1. Exact match (case-insensitive)
  const exact = list.find((d) => d.toLowerCase() === cleanDist)
  if (exact) return exact

  // 2. Contains match (e.g., "Mumbai" vs "Mumbai City", "Bangalore" vs "Bengaluru Urban")
  const match = list.find((d) => {
    const dLower = d.toLowerCase()
    return dLower.includes(cleanDist) || cleanDist.includes(dLower)
  })
  if (match) return match

  return null
}

/**
 * Lookup PIN code via India Post API.
 * Uses in-memory caching and supports AbortSignal.
 *
 * @param {string} pincode - 6-digit postal code
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<{
 *   success: boolean,
 *   rawState?: string,
 *   rawDistrict?: string,
 *   state?: string,
 *   district?: string,
 *   districtMatched?: boolean,
 *   postOffices?: string[],
 *   error?: string
 * }>}
 */
export async function lookupPincode(pincode, signal) {
  const clean = String(pincode || '').trim()
  if (!/^[1-9][0-9]{5}$/.test(clean)) {
    return {
      success: false,
      error: 'Please enter a valid 6-digit PIN code.',
    }
  }

  if (pincodeCache.has(clean)) {
    return pincodeCache.get(clean)
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      method: 'GET',
      signal,
    })

    if (!res.ok) {
      throw new Error(`Postal API responded with status ${res.status}`)
    }

    const data = await res.json()
    if (
      !Array.isArray(data) ||
      !data[0] ||
      data[0].Status !== 'Success' ||
      !Array.isArray(data[0].PostOffice) ||
      data[0].PostOffice.length === 0
    ) {
      const result = {
        success: false,
        error: "We couldn't find this pincode. Please select your state and district manually.",
      }
      pincodeCache.set(clean, result)
      return result
    }

    const po = data[0].PostOffice[0]
    const rawState = po.State || ''
    const rawDistrict = po.District || ''

    const matchedState = findCanonicalState(rawState)
    const matchedDistrict = matchedState ? findCanonicalDistrict(matchedState, rawDistrict) : null

    const result = {
      success: true,
      rawState,
      rawDistrict,
      state: matchedState || rawState,
      district: matchedDistrict || '',
      districtMatched: Boolean(matchedDistrict),
      postOffices: data[0].PostOffice.map((p) => p.Name).filter(Boolean).slice(0, 5),
    }

    pincodeCache.set(clean, result)
    return result
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err
    }
    return {
      success: false,
      error: "We couldn't find this pincode. Please select your state and district manually.",
    }
  }
}

export default lookupPincode

