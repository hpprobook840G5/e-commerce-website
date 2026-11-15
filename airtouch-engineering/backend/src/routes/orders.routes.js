import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import env from '../config/env.js'
import authenticateCustomer from '../middleware/authenticateCustomer.js'
import ordersController from '../controllers/orders.controller.js'
import {
  validateCreateOrder,
  validatePaymentReference,
  validateOrderNumberParam,
} from '../validators/order.validator.js'

const router = Router()

// All order endpoints require authenticated customer
router.use(authenticateCustomer)

// Rate limiter for order placement: 10 per 15 mins per customer id (with dev multiplier)
const windowMs = env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
const orderMax = env.isProduction
  ? env.RATE_LIMIT_ORDER_MAX
  : env.RATE_LIMIT_ORDER_MAX * env.RATE_LIMIT_DEV_MULTIPLIER

const orderCreationLimiter = rateLimit({
  windowMs,
  max: orderMax,
  keyGenerator: (req) => `order_create_${req.customer?.id || req.ip}`,
  message: {
    error: 'Too Many Requests',
    message: 'Too many order attempts. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiter for invoice downloads: 30 per 15 mins per customer id (with dev multiplier)
const invoiceDownloadLimiter = rateLimit({
  windowMs,
  max: env.isProduction ? 30 : 30 * env.RATE_LIMIT_DEV_MULTIPLIER,
  keyGenerator: (req) => `invoice_download_${req.customer?.id || req.ip}`,
  message: {
    error: 'Too Many Requests',
    message: 'Too many invoice download requests. Please wait a few minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// POST /api/orders
router.post('/', orderCreationLimiter, validateCreateOrder, ordersController.createOrder)

// GET /api/orders (List authenticated customer orders)
router.get('/', ordersController.listCustomerOrders)

// GET /api/orders/:orderNumber/invoice.pdf (Download customer invoice)
router.get(
  '/:orderNumber/invoice.pdf',
  invoiceDownloadLimiter,
  validateOrderNumberParam,
  ordersController.downloadInvoice
)

// GET /api/orders/:orderNumber
router.get('/:orderNumber', validateOrderNumberParam, ordersController.getOrder)

// POST /api/orders/:orderNumber/payment-reference
router.post(
  '/:orderNumber/payment-reference',
  validatePaymentReference,
  ordersController.submitPaymentReference
)

export default router
