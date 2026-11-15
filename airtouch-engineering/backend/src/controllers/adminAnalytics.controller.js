import salesAnalyticsService from '../services/salesAnalytics.service.js'
import orderService from '../services/order.service.js'
import invoiceService from '../services/invoice.service.js'

export const adminAnalyticsController = {
  async getSummary(req, res) {
    try {
      const summary = await salesAnalyticsService.getSummary()
      return res.json({ success: true, ...summary })
    } catch (err) {
      console.error('[AdminAnalyticsController] getSummary error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch summary metrics' })
    }
  },

  async getProductPerformance(req, res) {
    try {
      const products = await salesAnalyticsService.getProductPerformance()
      return res.json({ success: true, products })
    } catch (err) {
      console.error('[AdminAnalyticsController] getProductPerformance error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch product performance' })
    }
  },

  async getCategoryPerformance(req, res) {
    try {
      const categories = await salesAnalyticsService.getCategoryPerformance()
      return res.json({ success: true, categories })
    } catch (err) {
      console.error('[AdminAnalyticsController] getCategoryPerformance error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch category performance' })
    }
  },

  async getRevenueTrend(req, res) {
    const { range } = req.query
    try {
      const trend = await salesAnalyticsService.getRevenueTrend(range || '30d')
      return res.json({ success: true, trend })
    } catch (err) {
      console.error('[AdminAnalyticsController] getRevenueTrend error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch revenue trend' })
    }
  },

  async getOrders(req, res) {
    try {
      const result = await salesAnalyticsService.listOrders(req.query)
      return res.json({ success: true, ...result })
    } catch (err) {
      console.error('[AdminAnalyticsController] getOrders error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch orders' })
    }
  },

  async updateOrderStatus(req, res) {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['pending', 'completed'].includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Status must be either "pending" or "completed"',
      })
    }

    try {
      const updatedOrder = await salesAnalyticsService.updateOrderStatus(id, status)
      return res.json({ success: true, order: updatedOrder })
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ message: err.message })
      }
      console.error('[AdminAnalyticsController] updateOrderStatus error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to update order status' })
    }
  },

  async getOrderCounts(req, res) {
    try {
      const counts = await salesAnalyticsService.getOrderCounts()
      return res.json({ success: true, ...counts })
    } catch (err) {
      console.error('[AdminAnalyticsController] getOrderCounts error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch order counts' })
    }
  },

  async downloadOrderInvoice(req, res) {
    const { id } = req.params

    try {
      const order = await orderService.getOrderByIdForAdmin(id)
      if (!order) {
        return res.status(404).json({ error: 'Not Found', message: 'Order not found' })
      }

      const pdfBuffer = await invoiceService.generateInvoicePdf(order)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${order.orderNumber}.pdf"`)
      res.setHeader('Content-Length', pdfBuffer.length)

      return res.send(pdfBuffer)
    } catch (err) {
      console.error('[AdminAnalyticsController.downloadOrderInvoice Error]:', err.message)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to generate invoice' })
    }
  },
}

export default adminAnalyticsController
