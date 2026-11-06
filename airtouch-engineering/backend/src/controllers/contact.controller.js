import { validationResult } from 'express-validator'
import contactService from '../services/contactService.js'

export const contactController = {
  /**
   * POST /api/contact
   * Public contact form submission endpoint.
   */
  async submitContact(req, res) {
    // 1. Honeypot check: If the hidden "website" field contains any text, return 200 silently
    if (req.body.website && String(req.body.website).trim().length > 0) {
      return res.status(200).json({
        success: true,
        message: "Thanks, we'll reply within one working day.",
      })
    }

    // 2. Validate input fields
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please correct the highlighted form errors.',
        errors: errors.array(),
      })
    }

    const { name, mobile, email, topic, order_id, message } = req.body

    // Extract client IP address for salted SHA-256 hashing
    const rawIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      ''

    try {
      const result = await contactService.createContactMessage({
        name,
        mobile,
        email,
        topic,
        order_id,
        message,
        ip: rawIp,
      })

      return res.status(201).json({
        success: true,
        id: result.id,
        message: "Thanks, we'll reply within one working day.",
      })
    } catch (err) {
      console.error('[ContactController] Submission error:', err)
      // Never expose raw database errors to users
      return res.status(500).json({
        error: 'Internal Server Error',
        message: "Unable to submit your message at this time. Please try again later or contact us on WhatsApp.",
      })
    }
  },

  /**
   * GET /api/admin/contact-messages
   * Admin-only paginated listing with optional status and topic filters.
   */
  async listContactMessages(req, res) {
    const { page, limit, status, topic } = req.query

    try {
      const result = await contactService.getContactMessages({
        page,
        limit,
        status,
        topic,
      })

      return res.status(200).json({
        success: true,
        ...result,
      })
    } catch (err) {
      console.error('[ContactController] List messages error:', err)
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve contact messages.',
      })
    }
  },

  /**
   * PATCH /api/admin/contact-messages/:id
   * Admin-only status update endpoint.
   */
  async updateContactStatus(req, res) {
    const { id } = req.params
    const { status } = req.body

    const allowed = ['new', 'in_progress', 'resolved']
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid status. Must be one of: new, in_progress, resolved',
      })
    }

    try {
      const updated = await contactService.updateMessageStatus(id, status)
      if (!updated) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Contact message not found.',
        })
      }

      return res.status(200).json({
        success: true,
        message: 'Status updated successfully.',
        data: updated,
      })
    } catch (err) {
      console.error('[ContactController] Update status error:', err)
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update message status.',
      })
    }
  },
}

export default contactController

