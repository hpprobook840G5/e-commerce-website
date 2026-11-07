import localProductsData from '../data/products.json'
import { setDynamicProducts } from '../data/products.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Fallback in-memory catalog
const fallbackProducts = localProductsData.products || []

let cachedProducts = null
let hasShownDevFallbackNote = false

export async function fetchStorefrontProducts({ category = '', brand = '', search = '' } = {}) {
  const params = new URLSearchParams()
  if (category && category !== 'all') params.set('category', category)
  if (brand && brand !== 'all') params.set('brand', brand)
  if (search && search.trim()) params.set('search', search.trim())

  try {
    const res = await fetch(`${API_BASE_URL}/products?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.products) && data.products.length > 0) {
        cachedProducts = data.products
        setDynamicProducts(data.products)
        return {
          products: data.products,
          isCached: false,
        }
      }
    }
  } catch (err) {
    if (import.meta.env.DEV && !hasShownDevFallbackNote) {
      console.info('[Catalog] Showing cached catalogue (backend API unreachable)')
      hasShownDevFallbackNote = true
    }
  }

  // Fallback to local catalog
  let filtered = [...fallbackProducts]
  if (category && category !== 'all') {
    filtered = filtered.filter(
      (p) => (p.category || '').toLowerCase() === category.toLowerCase()
    )
  }
  if (brand && brand !== 'all') {
    filtered = filtered.filter((p) => p.brand === brand)
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    )
  }

  return {
    products: filtered,
    isCached: true,
  }
}

export async function fetchStorefrontProductById(idOrSlug) {
  if (!idOrSlug) return null

  try {
    const res = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(idOrSlug)}`)
    if (res.ok) {
      const data = await res.json()
      if (data.product) {
        return data.product
      }
    }
  } catch {
    // ignore, fall back to local
  }

  // Fallback to local
  const found = fallbackProducts.find(
    (p) => p.id === idOrSlug || p.slug === idOrSlug
  )
  return found || null
}
