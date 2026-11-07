import { supabaseAdmin, isAuthConfigured } from '../config/supabase.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendProductsPath = path.resolve(__dirname, '../../../frontend/src/data/products.json')

// In-memory fallback cache when Supabase database table has not been migrated yet
let memoryProducts = []

function loadInitialCatalog() {
  if (memoryProducts.length > 0) return
  try {
    if (fs.existsSync(frontendProductsPath)) {
      const raw = fs.readFileSync(frontendProductsPath, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.products)) {
        memoryProducts = parsed.products.map((p) => {
          const price = Number(p.price) || 0
          const mrp = Number(p.mrp || p.originalPrice || price)
          return {
            id: p.id || crypto.randomUUID(),
            slug: p.slug || generateSlug(p.name),
            name: p.name,
            brand: p.brand || 'AirTouch Apex',
            category: normalizeCategory(p.category),
            compatibility: Array.isArray(p.compatibility) ? p.compatibility : [],
            price_paise: Math.round(price * 100),
            mrp_paise: Math.round(mrp * 100),
            stock: typeof p.stock === 'number' ? p.stock : 20,
            image_url: p.image || (Array.isArray(p.images) ? p.images[0] : null),
            short_description: p.shortDescription || p.description || '',
            highlights: Array.isArray(p.highlights) ? p.highlights : [],
            specifications: Array.isArray(p.specifications) ? p.specifications : [],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        })
      }
    }
  } catch (err) {
    console.warn('[ProductService] Could not preload local catalog fallback:', err.message)
  }
}

loadInitialCatalog()

function normalizeCategory(cat = '') {
  const c = String(cat).toLowerCase()
  if (c.includes('brak')) return 'brakes'
  if (c.includes('engine') || c.includes('clutch')) return 'engine'
  if (c.includes('chassis') || c.includes('suspension')) return 'chassis'
  if (c.includes('tyre') || c.includes('tire') || c.includes('wheel')) return 'tyres'
  if (c.includes('exhaust')) return 'exhaust'
  if (c.includes('light') || c.includes('headlight')) return 'lighting'
  if (c.includes('seat')) return 'seats'
  if (c.includes('handlebar') || c.includes('lever') || c.includes('control')) return 'handlebars'
  return 'brakes'
}

export function generateSlug(name = '') {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'part'
  )
}

function formatProduct(row) {
  if (!row) return null
  const priceRupees = Math.round(Number(row.price_paise || 0) / 100)
  const mrpRupees = Math.round(Number(row.mrp_paise || row.price_paise || 0) / 100)
  const discountPercent =
    mrpRupees > priceRupees ? Math.round(((mrpRupees - priceRupees) / mrpRupees) * 100) : 0

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    title: row.name,
    brand: row.brand || 'AirTouch Apex',
    category: row.category,
    categoryName: capitalizeWords(row.category),
    compatibility: Array.isArray(row.compatibility) ? row.compatibility : [],
    price: priceRupees,
    price_paise: row.price_paise,
    mrp: mrpRupees,
    mrp_paise: row.mrp_paise,
    originalPrice: mrpRupees,
    discountPercent,
    stock: Number(row.stock || 0),
    image: row.image_url || '/placeholder-part.jpg',
    imageUrl: row.image_url || '/placeholder-part.jpg',
    image_url: row.image_url,
    images: row.image_url ? [row.image_url] : [],
    shortDescription: row.short_description || '',
    description: row.short_description || '',
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    specifications: Array.isArray(row.specifications) ? row.specifications : [],
    is_active: Boolean(row.is_active),
    status: row.is_active ? 'active' : 'hidden',
    rating: 4.8,
    reviewCount: 38,
    badges: discountPercent > 0 ? [`Sale -${discountPercent}%`] : [],
    warranty: '1 Year AirTouch Replacement Warranty',
    returnPolicy: '7 Days Replacement / Return if unopened or defective',
    deliveryDays: 3,
    seller: 'AirTouch Engineering Official Store',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function capitalizeWords(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const productService = {
  /**
   * Admin: Paginated product list with search and filters, including inactive products.
   */
  async listAdminProducts({ page = 1, limit = 20, search = '', category = '', status = 'all' }) {
    const p = Math.max(1, parseInt(page, 10) || 1)
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
    const offset = (p - 1) * l

    if (isAuthConfigured && supabaseAdmin) {
      try {
        let query = supabaseAdmin.from('products').select('*', { count: 'exact' })

        if (status === 'active') {
          query = query.eq('is_active', true)
        } else if (status === 'hidden') {
          query = query.eq('is_active', false)
        }

        if (category && category !== 'all') {
          query = query.eq('category', category.toLowerCase())
        }

        if (search && search.trim()) {
          const s = search.trim()
          query = query.or(`name.ilike.%${s}%,brand.ilike.%${s}%,slug.ilike.%${s}%`)
        }

        query = query.order('created_at', { ascending: false }).range(offset, offset + l - 1)

        const { data, count, error } = await query

        if (!error && data !== null) {
          return {
            products: data.map(formatProduct),
            total: count || data.length,
            page: p,
            limit: l,
            totalPages: Math.ceil((count || data.length) / l) || 1,
          }
        }
        console.warn('[ProductService] Database query failed or table missing, using memory store fallback:', error?.message)
      } catch (err) {
        console.warn('[ProductService] Database exception, using memory store fallback:', err.message)
      }
    }

    // In-memory fallback
    let filtered = [...memoryProducts]

    if (status === 'active') {
      filtered = filtered.filter((item) => item.is_active)
    } else if (status === 'hidden') {
      filtered = filtered.filter((item) => !item.is_active)
    }

    if (category && category !== 'all') {
      filtered = filtered.filter((item) => item.category === category.toLowerCase())
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.brand && item.brand.toLowerCase().includes(q)) ||
          item.slug.toLowerCase().includes(q)
      )
    }

    const total = filtered.length
    const paginated = filtered.slice(offset, offset + l)

    return {
      products: paginated.map(formatProduct),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l) || 1,
    }
  },

  /**
   * Admin: Get single product by ID (including inactive)
   */
  async getAdminProductById(id) {
    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).single()
        if (!error && data) {
          return formatProduct(data)
        }
      } catch (err) {
        console.warn('[ProductService] Get product by ID failed, trying memory store:', err.message)
      }
    }

    const found = memoryProducts.find((p) => p.id === id)
    return found ? formatProduct(found) : null
  },

  /**
   * Admin: Create new product
   */
  async createProduct(productData) {
    const name = productData.name.trim()
    const brand = productData.brand ? productData.brand.trim() : 'AirTouch Apex'
    const category = normalizeCategory(productData.category)
    const pricePaise = Math.round(Number(productData.price) * 100)
    const mrpPaise = Math.round(Number(productData.mrp || productData.price) * 100)
    const stock = Number(productData.stock || 0)
    const compatibility = Array.isArray(productData.compatibility) ? productData.compatibility : []
    const short_description = productData.short_description || ''
    const highlights = Array.isArray(productData.highlights) ? productData.highlights : []
    const specifications = Array.isArray(productData.specifications) ? productData.specifications : []
    const image_url = productData.image_url || null

    let isActive = true
    if (productData.status !== undefined) {
      isActive = String(productData.status).toLowerCase() === 'active'
    } else if (productData.is_active !== undefined) {
      isActive = Boolean(productData.is_active)
    }

    let baseSlug = generateSlug(name)
    let slug = baseSlug
    let counter = 1

    // Ensure unique slug
    if (isAuthConfigured && supabaseAdmin) {
      try {
        while (true) {
          const { data } = await supabaseAdmin.from('products').select('id').eq('slug', slug).maybeSingle()
          if (!data) break
          slug = `${baseSlug}-${counter++}`
        }

        const payload = {
          slug,
          name,
          brand,
          category,
          compatibility,
          price_paise: pricePaise,
          mrp_paise: mrpPaise,
          stock,
          image_url,
          short_description,
          highlights,
          specifications,
          is_active: isActive,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabaseAdmin.from('products').insert(payload).select().single()

        if (!error && data) {
          memoryProducts.unshift(data)
          return formatProduct(data)
        }
        console.warn('[ProductService] Insert failed in Supabase, using memory store:', error?.message)
      } catch (err) {
        console.warn('[ProductService] Insert exception, using memory store:', err.message)
      }
    }

    // Fallback to memory
    while (memoryProducts.some((p) => p.slug === slug)) {
      slug = `${baseSlug}-${counter++}`
    }

    const newProduct = {
      id: crypto.randomUUID(),
      slug,
      name,
      brand,
      category,
      compatibility,
      price_paise: pricePaise,
      mrp_paise: mrpPaise,
      stock,
      image_url,
      short_description,
      highlights,
      specifications,
      is_active: isActive,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    memoryProducts.unshift(newProduct)
    return formatProduct(newProduct)
  },

  /**
   * Admin: Update product details
   */
  async updateProduct(id, updates) {
    const payload = {}
    if (updates.name !== undefined) payload.name = updates.name.trim()
    if (updates.brand !== undefined) payload.brand = updates.brand.trim()
    if (updates.category !== undefined) payload.category = normalizeCategory(updates.category)
    if (updates.price !== undefined) payload.price_paise = Math.round(Number(updates.price) * 100)
    if (updates.mrp !== undefined) payload.mrp_paise = Math.round(Number(updates.mrp) * 100)
    if (updates.stock !== undefined) payload.stock = Number(updates.stock)
    if (updates.compatibility !== undefined) payload.compatibility = updates.compatibility
    if (updates.short_description !== undefined) payload.short_description = updates.short_description
    if (updates.highlights !== undefined) payload.highlights = updates.highlights
    if (updates.specifications !== undefined) payload.specifications = updates.specifications
    if (updates.image_url !== undefined) payload.image_url = updates.image_url
    if (updates.status !== undefined) {
      payload.is_active = String(updates.status).toLowerCase() === 'active'
    } else if (updates.is_active !== undefined) {
      payload.is_active = Boolean(updates.is_active)
    }
    payload.updated_at = new Date().toISOString()

    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('products')
          .update(payload)
          .eq('id', id)
          .select()
          .single()

        if (!error && data) {
          const idx = memoryProducts.findIndex((p) => p.id === id)
          if (idx !== -1) memoryProducts[idx] = { ...memoryProducts[idx], ...data }
          return formatProduct(data)
        }
        console.warn('[ProductService] Update failed in Supabase, using memory store:', error?.message)
      } catch (err) {
        console.warn('[ProductService] Update exception, using memory store:', err.message)
      }
    }

    const idx = memoryProducts.findIndex((p) => p.id === id)
    if (idx === -1) return null

    memoryProducts[idx] = {
      ...memoryProducts[idx],
      ...payload,
    }
    return formatProduct(memoryProducts[idx])
  },

  /**
   * Admin: Soft-delete product (sets is_active = false)
   */
  async softDeleteProduct(id) {
    return this.updateProduct(id, { is_active: false })
  },

  /**
   * Admin: Upload product image to Supabase Storage bucket 'product-images'
   */
  async uploadImage(productId, file) {
    if (!file) throw new Error('No image file provided')

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedMimes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.')
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new Error('File size exceeds the 2 MB limit.')
    }

    const ext = file.mimetype.split('/')[1] === 'jpeg' ? 'jpg' : file.mimetype.split('/')[1]
    const fileName = `${productId}_${Date.now()}.${ext}`
    const storagePath = `catalog/${fileName}`

    let publicUrl = null

    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { error: uploadError } = await supabaseAdmin.storage
          .from('product-images')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          })

        if (!uploadError) {
          const { data: publicData } = supabaseAdmin.storage
            .from('product-images')
            .getPublicUrl(storagePath)

          publicUrl = publicData?.publicUrl
        } else {
          console.warn('[ProductService] Supabase storage upload error:', uploadError.message)
        }
      } catch (err) {
        console.warn('[ProductService] Supabase storage exception:', err.message)
      }
    }

    // If storage is not configured or failed, generate a clean data URL or local placeholder
    if (!publicUrl) {
      const base64 = file.buffer.toString('base64')
      publicUrl = `data:${file.mimetype};base64,${base64}`
    }

    // Persist to product record
    await this.updateProduct(productId, { image_url: publicUrl })

    return publicUrl
  },

  /**
   * Public: List active products for storefront
   */
  async listPublicProducts({ page = 1, limit = 50, search = '', category = '', brand = '' }) {
    const p = Math.max(1, parseInt(page, 10) || 1)
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 50))
    const offset = (p - 1) * l

    if (isAuthConfigured && supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from('products')
          .select('*', { count: 'exact' })
          .eq('is_active', true)

        if (category && category !== 'all') {
          query = query.eq('category', category.toLowerCase())
        }

        if (brand && brand !== 'all') {
          query = query.eq('brand', brand)
        }

        if (search && search.trim()) {
          const s = search.trim()
          query = query.or(`name.ilike.%${s}%,brand.ilike.%${s}%,slug.ilike.%${s}%`)
        }

        query = query.order('created_at', { ascending: false }).range(offset, offset + l - 1)

        const { data, count, error } = await query

        if (!error && data !== null && data.length > 0) {
          return {
            products: data.map(formatProduct),
            total: count || data.length,
            page: p,
            limit: l,
            totalPages: Math.ceil((count || data.length) / l) || 1,
            isFromDb: true,
          }
        }
      } catch (err) {
        console.warn('[ProductService] Public database query failed, using memory fallback:', err.message)
      }
    }

    // Memory fallback
    let filtered = memoryProducts.filter((p) => p.is_active)

    if (category && category !== 'all') {
      filtered = filtered.filter((p) => p.category === category.toLowerCase())
    }

    if (brand && brand !== 'all') {
      filtered = filtered.filter((p) => p.brand === brand)
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          p.slug.toLowerCase().includes(q)
      )
    }

    const total = filtered.length
    const paginated = filtered.slice(offset, offset + l)

    return {
      products: paginated.map(formatProduct),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l) || 1,
      isFromDb: false,
    }
  },

  /**
   * Public: Single product details by slug or ID
   */
  async getPublicProductBySlug(slugOrId) {
    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('products')
          .select('*')
          .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
          .eq('is_active', true)
          .maybeSingle()

        if (!error && data) {
          return formatProduct(data)
        }
      } catch (err) {
        console.warn('[ProductService] Single product DB query failed, using memory fallback:', err.message)
      }
    }

    const found = memoryProducts.find(
      (p) => p.is_active && (p.slug === slugOrId || p.id === slugOrId)
    )
    return found ? formatProduct(found) : null
  },
}

export default productService
