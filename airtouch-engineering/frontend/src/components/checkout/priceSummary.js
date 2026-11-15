import {
  PLATFORM_FEE_INR,
  FREE_DELIVERY_THRESHOLD_INR,
  DELIVERY_FEE_INR,
} from '../../config/checkout.js'

export const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/**
 * Format a numeric amount in INR (e.g. ₹1,299).
 *
 * @param {number} amount
 * @returns {string}
 */
export function formatINR(amount) {
  const numeric = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0
  return inrFormatter.format(Math.round(numeric))
}

/**
 * Format discount with real minus sign and currency (e.g. −₹1,651).
 *
 * @param {number} discount
 * @returns {string}
 */
export function formatNegativeDiscount(discount) {
  const numeric = typeof discount === 'number' && !Number.isNaN(discount) ? discount : 0
  if (numeric <= 0) return formatINR(0)
  return `\u2212${formatINR(numeric)}`
}

/**
 * Pure calculation function for checkout and cart price breakdowns.
 *
 * Inputs:
 *   items: Array<{ price: number, mrp?: number, originalPrice?: number, quantity: number }>
 *   options?: { platformFee?: number, threshold?: number, standardDeliveryFee?: number }
 *
 * Outputs:
 *   sellingTotal: sum of (item.price * quantity)
 *   mrpTotal: sum of (item.mrp * quantity)
 *   discount: total MRP - total selling price (>= 0)
 *   platformFee: platform fee in INR
 *   deliveryFee: 0 if sellingTotal >= threshold or cart empty, else standard delivery fee
 *   total: sellingTotal + platformFee + deliveryFee
 *   savings: discount
 *
 * @param {Array<object>} items
 * @param {object} [options]
 * @returns {{
 *   sellingTotal: number,
 *   mrpTotal: number,
 *   discount: number,
 *   platformFee: number,
 *   deliveryFee: number,
 *   total: number,
 *   savings: number
 * }}
 */
export function calculatePriceSummary(items = [], options = {}) {
  const platformFeeRate =
    typeof options.platformFee === 'number' ? options.platformFee : PLATFORM_FEE_INR
  const threshold =
    typeof options.threshold === 'number'
      ? options.threshold
      : FREE_DELIVERY_THRESHOLD_INR
  const standardFee =
    typeof options.standardDeliveryFee === 'number'
      ? options.standardDeliveryFee
      : DELIVERY_FEE_INR

  let sellingTotal = 0
  let mrpTotal = 0

  if (Array.isArray(items)) {
    for (const item of items) {
      if (!item) continue
      const qty = Math.max(1, Number(item.quantity) || 1)
      const price = Number(item.price) || 0
      const mrp = Number(item.mrp || item.originalPrice || price)

      sellingTotal += price * qty
      mrpTotal += mrp * qty
    }
  }

  const discount = Math.max(0, mrpTotal - sellingTotal)
  const savings = discount

  let deliveryFee = 0
  let platformFee = 0

  if (sellingTotal > 0) {
    platformFee = platformFeeRate
    deliveryFee = sellingTotal >= threshold ? 0 : standardFee
  }

  // NOTE: Selling total is already the net price of products.
  // Total = Selling Total + Platform Fee + Delivery Fee.
  // Discount is purely informational ("You save ₹X") and must NOT be subtracted again.
  const total = sellingTotal + platformFee + deliveryFee

  return {
    sellingTotal,
    mrpTotal,
    discount,
    platformFee,
    deliveryFee,
    total,
    savings,
  }
}
