import { Router } from 'express'
import publicProductController from '../controllers/publicProduct.controller.js'

const router = Router()

/**
 * GET /api/products
 * Public storefront: List active products with optional search, category, brand, and pagination.
 */
router.get('/', publicProductController.getProducts)

/**
 * GET /api/products/:slug
 * Public storefront: Retrieve single active product by slug or id.
 */
router.get('/:slug', publicProductController.getProductBySlug)

export default router
