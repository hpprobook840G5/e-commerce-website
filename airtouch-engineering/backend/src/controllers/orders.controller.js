import orderService from '../services/order.service.js'

export const ordersController = {
  /**
   * POST /api/orders
   * Create a new customer order.
   */
  async createOrder(req, res) {
    const customerId = req.customer?.id
    const customerAuthEmail = req.customer?.email

    try {
      const result = await orderService.createOrder({
        customerId,
        customerAuthEmail,
        orderData: req.body,
      })

      if (result.isDuplicate) {
        return res.status(200).json(result.order)
      }

      return res.status(201).json(result)
    } catch (err) {
      if (err.code === 'ITEM_UNAVAILABLE') {
        return res.status(409).json({
          code: 'ITEM_UNAVAILABLE',
          message: err.message,
          items: err.items || [],
        })
      }

      if (err.code === 'PRICE_CHANGED') {
        return res.status(409).json({
          code: 'PRICE_CHANGED',
          message: err.message,
          total: err.total,
        })
      }

      if (err.status === 503) {
        return res.status(503).json({
          message: err.message || 'UPI payment is not configured.',
        })
      }

      console.error('[OrdersController.createOrder Error]:', err.message)
      return res.status(500).json({
        message: 'Unable to process your order. Please try again.',
      })
    }
  },

  /**
   * GET /api/orders/:orderNumber
   * Fetch customer order details. Returns 404 if not found or unauthorized.
   */
  async getOrder(req, res) {
    const { orderNumber } = req.params
    const customerId = req.customer?.id

    try {
      const order = await orderService.getOrderByNumberForCustomer(orderNumber, customerId)
      if (!order) {
        return res.status(404).json({ message: 'Order not found' })
      }
      return res.json(order)
    } catch (err) {
      console.error('[OrdersController.getOrder Error]:', err.message)
      return res.status(500).json({ message: 'Failed to retrieve order details' })
    }
  },

  /**
   * POST /api/orders/:orderNumber/payment-reference
   * Submit transaction ID for UPI orders.
   */
  async submitPaymentReference(req, res) {
    const { orderNumber } = req.params
    const customerId = req.customer?.id
    const { reference } = req.body

    try {
      const result = await orderService.submitPaymentReference({
        orderNumber,
        customerId,
        reference,
      })
      return res.json(result)
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ message: err.message })
      }
      console.error('[OrdersController.submitPaymentReference Error]:', err.message)
      return res.status(500).json({ message: 'Failed to record payment reference' })
    }
  },
}

export default ordersController
