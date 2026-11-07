import productService from '../services/product.service.js'

export const publicProductController = {
  async getProducts(req, res) {
    const { page, limit, search, category, brand } = req.query
    try {
      const result = await productService.listPublicProducts({
        page,
        limit,
        search,
        category,
        brand,
      })
      return res.json({
        success: true,
        ...result,
      })
    } catch (err) {
      console.error('[PublicProductController] getProducts error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve products' })
    }
  },

  async getProductBySlug(req, res) {
    const { slug } = req.params
    try {
      const product = await productService.getPublicProductBySlug(slug)
      if (!product) {
        return res.status(404).json({ error: 'Not Found', message: 'Product not found' })
      }
      return res.json({ success: true, product })
    } catch (err) {
      console.error('[PublicProductController] getProductBySlug error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve product details' })
    }
  },
}

export default publicProductController
