/**
 * AirTouch Engineering - Phone Normalization Utility
 * Normalizes Indian mobile numbers to E.164 format (+91XXXXXXXXXX).
 *
 * Rules:
 * - Accepts 10 digits starting with 6, 7, 8, or 9.
 * - Strips whitespace, dashes, brackets, and leading +91, 91, or 0.
 * - Returns '+91XXXXXXXXXX' on valid numbers; returns null on invalid input.
 *
 * @param {string|number} input
 * @returns {string|null}
 */
export function normalizeIndianMobile(input) {
  if (input === null || input === undefined) return null

  // Strip spaces, dashes, parentheses
  let cleaned = String(input).trim().replace(/[\s\-()]/g, '')

  // Strip leading international prefix (+91 or 91) or domestic prefix (0)
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3)
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2)
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1)
  }

  // Must be exactly 10 digits starting with 6, 7, 8, or 9
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`
  }

  return null
}

export default normalizeIndianMobile

