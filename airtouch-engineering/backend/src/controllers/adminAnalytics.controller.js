import salesAnalyticsService from '../services/salesAnalytics.service.js'

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
      const orders = await salesAnalyticsService.listOrders()
      return res.json({ success: true, orders })
    } catch (err) {
      console.error('[AdminAnalyticsController] getOrders error:', err)
      return res.status(500).json({ error: 'Server Error', message: 'Failed to fetch orders' })
    }
  },
}

export default adminAnalyticsController
