import env from '../config/env.js'
import { sendMail } from '../config/mailer.js'

/**
 * Service to notify the shop owner / administrator about new customer orders.
 * Non-blocking: Failures are logged with error code only and never throw or fail the order creation.
 */
export async function notifyAdminNewOrder(order) {
  const recipient = env.ADMIN_NOTIFY_EMAIL
  if (!recipient) {
    // Skip silently if unset
    return { skipped: true, reason: 'ADMIN_NOTIFY_EMAIL_UNSET' }
  }

  const {
    orderNumber,
    orderType,
    customerName,
    customerMobile,
    customerEmail,
    totals,
    items = [],
    shippingAddress,
  } = order

  const orderTypeUpper = String(orderType || 'request').toUpperCase()
  const totalRupees = totals?.total ?? Math.round((Number(order.total_paise) || 0) / 100)

  let typeSpecificNote = ''
  if (orderType === 'request') {
    typeSpecificNote = 'Customer wants to talk first. Contact them.'
  } else if (orderType === 'upi') {
    typeSpecificNote = `Customer chose UPI. Verify the credit of ₹${totalRupees.toLocaleString('en-IN')} before marking completed.`
  } else if (orderType === 'cod') {
    typeSpecificNote = `Cash on Delivery order. Collect ₹${totalRupees.toLocaleString('en-IN')} on delivery.`
  }

  const formattedAddress = shippingAddress
    ? `${shippingAddress.line1 || shippingAddress.addressLine1 || ''}${
        shippingAddress.landmark ? `, near ${shippingAddress.landmark}` : ''
      }, ${shippingAddress.district || ''}, ${shippingAddress.state || ''} - ${shippingAddress.pincode || ''}`
    : 'Not provided'

  const itemsListText = items
    .map(
      (item) =>
        `- ${item.quantity}x ${item.productName || item.product_name} (₹${(
          item.unitPrice || Math.round((Number(item.unit_price_paise) || 0) / 100)
        ).toLocaleString('en-IN')}) = ₹${(
          item.lineTotal || Math.round((Number(item.line_total_paise) || 0) / 100)
        ).toLocaleString('en-IN')}`
    )
    .join('\n')

  const itemsListHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #333;">${item.productName || item.product_name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #333; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #333; text-align: right;">₹${(
            item.unitPrice || Math.round((Number(item.unit_price_paise) || 0) / 100)
          ).toLocaleString('en-IN')}</td>
          <td style="padding: 8px; border-bottom: 1px solid #333; text-align: right; font-weight: bold;">₹${(
            item.lineTotal || Math.round((Number(item.line_total_paise) || 0) / 100)
          ).toLocaleString('en-IN')}</td>
        </tr>`
    )
    .join('')

  const subject = `New order ${orderNumber} (${orderTypeUpper})`

  const textBody = `
New Order Received: ${orderNumber}
Order Type: ${orderTypeUpper}
${typeSpecificNote ? `Notice: ${typeSpecificNote}\n` : ''}
Customer Details:
- Name: ${customerName || 'N/A'}
- Mobile: ${customerMobile || 'N/A'}
- Email: ${customerEmail || 'N/A'}

Delivery Address:
${formattedAddress}

Items:
${itemsListText}

Order Summary:
- Selling Price: ₹${(totals?.sellingTotal || 0).toLocaleString('en-IN')}
- Platform Fee: ₹${(totals?.platformFee || 0).toLocaleString('en-IN')}
- Delivery: ${totals?.deliveryFee === 0 ? 'Free' : `₹${(totals?.deliveryFee || 0).toLocaleString('en-IN')}`}
- Grand Total: ₹${totalRupees.toLocaleString('en-IN')}
`.trim()

  const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #f4f4f5; background: #09090b; padding: 24px; border-radius: 12px; border: 1px solid #27272a;">
  <h2 style="color: #f97316; margin-top: 0; font-size: 20px;">New Order Received: ${orderNumber}</h2>
  <p style="font-size: 14px; margin-bottom: 16px;"><strong>Order Type:</strong> <span style="background: #27272a; padding: 3px 8px; border-radius: 4px; color: #fb923c;">${orderTypeUpper}</span></p>

  ${
    typeSpecificNote
      ? `<div style="background: rgba(249, 115, 22, 0.1); border-left: 4px solid #f97316; padding: 12px; margin-bottom: 20px; font-size: 13px; color: #fdba74;">
          <strong>Action Required:</strong> ${typeSpecificNote}
        </div>`
      : ''
  }

  <h3 style="font-size: 14px; color: #e4e4e7; border-bottom: 1px solid #27272a; padding-bottom: 6px;">Customer & Delivery Details</h3>
  <table style="width: 100%; font-size: 13px; margin-bottom: 20px; color: #d4d4d8;">
    <tr><td style="padding: 4px 0; width: 120px; color: #a1a1aa;">Name:</td><td><strong>${customerName || 'N/A'}</strong></td></tr>
    <tr><td style="padding: 4px 0; color: #a1a1aa;">Mobile:</td><td><a href="tel:${customerMobile}" style="color: #f97316;">${customerMobile || 'N/A'}</a></td></tr>
    <tr><td style="padding: 4px 0; color: #a1a1aa;">Email:</td><td>${customerEmail || 'N/A'}</td></tr>
    <tr><td style="padding: 4px 0; color: #a1a1aa; vertical-align: top;">Shipping To:</td><td>${formattedAddress}</td></tr>
  </table>

  <h3 style="font-size: 14px; color: #e4e4e7; border-bottom: 1px solid #27272a; padding-bottom: 6px;">Items Manifest</h3>
  <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-bottom: 20px;">
    <thead>
      <tr style="color: #a1a1aa; text-align: left; border-bottom: 1px solid #3f3f46;">
        <th style="padding: 8px;">Product</th>
        <th style="padding: 8px; text-align: center;">Qty</th>
        <th style="padding: 8px; text-align: right;">Unit Price</th>
        <th style="padding: 8px; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsListHtml}
    </tbody>
  </table>

  <div style="background: #18181b; padding: 16px; border-radius: 8px; border: 1px solid #27272a;">
    <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; color: #fff;">
      <span>Total Amount:</span>
      <span style="color: #f97316;">₹${totalRupees.toLocaleString('en-IN')}</span>
    </div>
  </div>

  <p style="font-size: 11px; color: #71717a; margin-top: 24px; text-align: center;">
    AirTouch Engineering Order Management System
  </p>
</div>
`.trim()

  try {
    await sendMail({
      to: recipient,
      subject,
      text: textBody,
      html: htmlBody,
    })
    return { success: true, notifiedAt: new Date().toISOString() }
  } catch (err) {
    // Log only the error code on failure; never include secrets or passwords
    console.warn(`[Order Notification Error]: Code ${err.code || err.name || 'UNKNOWN'}`)
    return { success: false, error: err.code || 'NOTIFICATION_FAILED' }
  }
}

export default {
  notifyAdminNewOrder,
}
