import { validationResult } from 'express-validator'
import productService from '../services/product.service.js'

export const adminProductController = {
  async listProducts(req, res) {
    const { page, limit, search, category, status } = req.query
    try {
      const data = await productService.listAdminProducts({
        page,
        limit,
        search,
        category,
        status,
      })
      return res.json({ success: true, ...data })
    } catch (err) {
      console.error('[AdminProductController] listProducts error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch products' })
    }
  },

  async createProduct(req, res) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid product input',
        errors: errors.array(),
      })
    }

    try {
      const product = await productService.createProduct(req.body)
      return res.status(201).json({ success: true, product })
    } catch (err) {
      console.error('[AdminProductController] createProduct error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to create product' })
    }
  },

  async updateProduct(req, res) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid product update',
        errors: errors.array(),
      })
    }

    const { id } = req.params
    try {
      const updated = await productService.updateProduct(id, req.body)
      if (!updated) {
        return res.status(404).json({ error: 'Not Found', message: 'Product not found' })
      }
      return res.json({ success: true, product: updated })
    } catch (err) {
      console.error('[AdminProductController] updateProduct error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to update product' })
    }
  },

  async deleteProduct(req, res) {
    const { id } = req.params
    try {
      const deleted = await productService.softDeleteProduct(id)
      if (!deleted) {
        return res.status(404).json({ error: 'Not Found', message: 'Product not found' })
      }
      return res.json({
        success: true,
        message: 'Product hidden from storefront successfully.',
        product: deleted,
      })
    } catch (err) {
      console.error('[AdminProductController] deleteProduct error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to delete product' })
    }
  },

  async uploadImage(req, res) {
    const { id } = req.params
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide an image file (JPEG, PNG, or WebP, max 2 MB)',
      })
    }

    try {
      const imageUrl = await productService.uploadImage(id, req.file)
      return res.json({
        success: true,
        message: 'Product image uploaded successfully.',
        imageUrl,
      })
    } catch (err) {
      console.error('[AdminProductController] uploadImage error:', err)
      return res.status(400).json({
        error: 'Upload Failed',
        message: err.message || 'Image upload failed',
      })
    }
  },
}

export default adminProductController
