import orderService from '../services/order.service.js'
import invoiceService from '../services/invoice.service.js'

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
   * GET /api/orders
   * List orders for the authenticated customer.
   */
  async listCustomerOrders(req, res) {
    const customerId = req.customer?.id
    const customerEmail = req.customer?.email
    const { page, limit } = req.query

    if (!customerId) {
      return res.status(401).json({ message: 'Please sign in again.' })
    }

    try {
      const result = await orderService.listOrdersForCustomer({
        customerId,
        customerEmail,
        page,
        limit,
      })

      return res.json(result)
    } catch (err) {
      console.error('[OrdersController.listCustomerOrders Error]:', err.message)
      return res.status(500).json({ message: 'Failed to retrieve orders' })
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
   * GET /api/orders/:orderNumber/invoice.pdf
   * Download PDF invoice for customer order.
   */
  async downloadInvoice(req, res) {
    const { orderNumber } = req.params
    const customerId = req.customer?.id

    try {
      const order = await orderService.getOrderByNumberForCustomer(orderNumber, customerId)
      if (!order) {
        return res.status(404).json({ message: 'Order not found' })
      }

      const pdfBuffer = await invoiceService.generateInvoicePdf(order)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${order.orderNumber}.pdf"`)
      res.setHeader('Content-Length', pdfBuffer.length)

      return res.send(pdfBuffer)
    } catch (err) {
      console.error('[OrdersController.downloadInvoice Error]:', err.message)
      return res.status(500).json({ message: 'Failed to generate invoice.' })
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
