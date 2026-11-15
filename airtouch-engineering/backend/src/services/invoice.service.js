import PDFDocument from 'pdfkit'
import env from '../config/env.js'

function formatCurrency(amount) {
  const num = Number(amount) || 0
  return `Rs. ${num.toLocaleString('en-IN')}`
}

function formatDate(isoStr) {
  if (!isoStr) return 'N/A'
  try {
    const d = new Date(isoStr)
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return isoStr
  }
}

/**
 * Generate a downloadable PDF invoice for an order.
 *
 * @param {object} order - Standard order object from orderService
 * @returns {Promise<Buffer>}
 */
export function generateInvoicePdf(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Invoice - ${order.orderNumber}`,
          Author: 'AirTouch Engineering',
          Subject: 'Order Invoice',
        },
      })

      const chunks = []
      doc.on('data', (c) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', (err) => reject(err))

      const pageWidth = 595.28
      const margin = 40
      const contentWidth = pageWidth - margin * 2 // 515.28

      const isCompleted = (order.status || '').toLowerCase() === 'completed'
      const invoiceTitle = isCompleted ? 'TAX INVOICE' : 'INVOICE (PAYMENT PENDING)'

      // Business details from env
      const businessName = env.INVOICE_BUSINESS_NAME || 'AirTouch Engineering'
      const businessAddress = env.INVOICE_BUSINESS_ADDRESS || ''
      const businessGstin = env.INVOICE_GSTIN || ''

      // 1. TOP HEADER BAR
      let y = 40
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#111827').text(businessName, margin, y)
      y += 24

      doc.font('Helvetica').fontSize(9).fillColor('#4B5563')
      if (businessAddress) {
        doc.text(businessAddress, margin, y)
        y += 13
      }
      if (businessGstin) {
        doc.text(`GSTIN: ${businessGstin}`, margin, y)
        y += 13
      }

      // Title & Badge (Right Aligned or Block)
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(isCompleted ? '#047857' : '#D97706')
        .text(invoiceTitle, margin, 40, { width: contentWidth, align: 'right' })

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#6B7280')
        .text(`Status: ${isCompleted ? 'COMPLETED (PAID)' : 'PAYMENT PENDING'}`, margin, 58, {
          width: contentWidth,
          align: 'right',
        })

      y = Math.max(y + 10, 85)

      // Divider line
      doc
        .strokeColor('#E5E7EB')
        .lineWidth(1)
        .moveTo(margin, y)
        .lineTo(pageWidth - margin, y)
        .stroke()
      y += 15

      // 2. INVOICE META & BILL TO (Two Columns)
      const colWidth = (contentWidth - 20) / 2
      const leftColX = margin
      const rightColX = margin + colWidth + 20

      // Left Column: Invoice Details
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('INVOICE DETAILS', leftColX, y)
      let metaY = y + 16
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#374151')
      doc.text('Invoice / Order No: ', leftColX, metaY, { continued: true })
      doc.font('Helvetica').text(order.orderNumber)
      metaY += 13

      doc.font('Helvetica-Bold').text('Invoice Date: ', leftColX, metaY, { continued: true })
      doc.font('Helvetica').text(formatDate(order.createdAt))
      metaY += 13

      const orderTypeLabel =
        order.orderType === 'upi'
          ? 'UPI Payment'
          : order.orderType === 'cod'
          ? 'Cash on Delivery (COD)'
          : 'Request Order'

      doc.font('Helvetica-Bold').text('Payment Method: ', leftColX, metaY, { continued: true })
      doc.font('Helvetica').text(orderTypeLabel)
      metaY += 13

      if (order.completedAt) {
        doc.font('Helvetica-Bold').text('Completed Date: ', leftColX, metaY, { continued: true })
        doc.font('Helvetica').text(formatDate(order.completedAt))
        metaY += 13
      }

      // Right Column: Bill To / Ship To
      const addr = order.shippingAddress || {}
      const customerName = order.customerName || addr.fullName || 'Valued Customer'
      const customerMobile = order.customerMobile || addr.mobile || ''
      const customerEmail = order.customerEmail || ''

      doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('BILL TO / SHIP TO', rightColX, y)
      let billY = y + 16

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#1F2937').text(customerName, rightColX, billY)
      billY += 13

      doc.font('Helvetica').fontSize(9).fillColor('#4B5563')
      if (customerMobile) {
        doc.text(`Mobile: ${customerMobile}`, rightColX, billY)
        billY += 13
      }
      if (customerEmail) {
        doc.text(`Email: ${customerEmail}`, rightColX, billY)
        billY += 13
      }

      // Address lines
      const line1 = addr.line1 || addr.addressLine1 || ''
      if (line1) {
        doc.text(line1, rightColX, billY, { width: colWidth })
        billY += 13
      }
      if (addr.landmark) {
        doc.text(`Landmark: ${addr.landmark}`, rightColX, billY, { width: colWidth })
        billY += 13
      }
      const cityStatePin = [addr.district, addr.state].filter(Boolean).join(', ')
      const pinStr = addr.pincode ? ` - ${addr.pincode}` : ''
      if (cityStatePin || pinStr) {
        doc.text(`${cityStatePin}${pinStr}`, rightColX, billY, { width: colWidth })
        billY += 13
      }
      doc.text(addr.country || 'India', rightColX, billY)
      billY += 13

      y = Math.max(metaY, billY) + 20

      // 3. ITEMS TABLE
      // Table Header
      const tableX = margin
      const colSnoX = tableX
      const colSnoW = 25

      const colDescX = colSnoX + colSnoW + 5
      const colDescW = 240

      const colQtyX = colDescX + colDescW + 5
      const colQtyW = 45

      const colPriceX = colQtyX + colQtyW + 5
      const colPriceW = 85

      const colTotalX = colPriceX + colPriceW + 5
      const colTotalW = 100

      // Header Bar Background
      doc
        .rect(tableX, y, contentWidth, 20)
        .fillColor('#F3F4F6')
        .fill()

      // Header Texts
      const headerY = y + 5
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#374151')
      doc.text('#', colSnoX + 4, headerY, { width: colSnoW })
      doc.text('PRODUCT DESCRIPTION', colDescX, headerY, { width: colDescW })
      doc.text('QTY', colQtyX, headerY, { width: colQtyW, align: 'center' })
      doc.text('UNIT PRICE', colPriceX, headerY, { width: colPriceW, align: 'right' })
      doc.text('LINE TOTAL', colTotalX, headerY, { width: colTotalW - 4, align: 'right' })

      y += 20

      // Table Rows
      const items = order.items && order.items.length > 0 ? order.items : []
      doc.font('Helvetica').fontSize(9).fillColor('#1F2937')

      items.forEach((item, index) => {
        const rowBg = index % 2 === 1 ? '#FAFAFA' : '#FFFFFF'
        const itemY = y

        doc
          .rect(tableX, itemY, contentWidth, 22)
          .fillColor(rowBg)
          .fill()

        doc.fillColor('#1F2937')
        doc.text(String(index + 1), colSnoX + 4, itemY + 6, { width: colSnoW })
        doc.text(item.productName || 'Components Part', colDescX, itemY + 6, {
          width: colDescW,
          ellipsis: true,
        })
        doc.text(String(item.quantity || 1), colQtyX, itemY + 6, {
          width: colQtyW,
          align: 'center',
        })
        doc.text(formatCurrency(item.unitPrice), colPriceX, itemY + 6, {
          width: colPriceW,
          align: 'right',
        })
        doc.text(formatCurrency(item.lineTotal), colTotalX, itemY + 6, {
          width: colTotalW - 4,
          align: 'right',
        })

        // Row bottom divider
        doc
          .strokeColor('#E5E7EB')
          .lineWidth(0.5)
          .moveTo(tableX, itemY + 22)
          .lineTo(tableX + contentWidth, itemY + 22)
          .stroke()

        y += 22
      })

      y += 15

      // 4. PAYMENT BLOCK & TOTALS BLOCK
      const totals = order.totals || {}
      const blockWidth = 220
      const totalsX = pageWidth - margin - blockWidth

      // Payment Details Block (Left)
      const payBoxW = 240
      doc
        .rect(margin, y, payBoxW, 75)
        .strokeColor('#E5E7EB')
        .lineWidth(1)
        .fillColor('#F9FAFB')
        .fillAndStroke()

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#111827').text('PAYMENT DETAILS', margin + 12, y + 10)

      doc.font('Helvetica').fontSize(8).fillColor('#4B5563')
      doc.text(`Method: ${orderTypeLabel}`, margin + 12, y + 25)
      doc.text(
        `Status: ${isCompleted ? 'Payment Received / Confirmed' : 'Payment Pending Verification'}`,
        margin + 12,
        y + 38
      )
      if (order.orderType === 'upi' && order.upiReference) {
        doc.font('Helvetica-Bold').text(`UPI Ref: ${order.upiReference}`, margin + 12, y + 51)
      } else if (order.orderType === 'upi') {
        doc.text('UPI Ref: Pending Customer Submission', margin + 12, y + 51)
      } else if (order.orderType === 'cod') {
        doc.text('Collectible on Delivery by Courier', margin + 12, y + 51)
      }

      // Totals (Right)
      let tY = y
      doc.font('Helvetica').fontSize(8.5).fillColor('#4B5563')

      const printTotalRow = (label, valueStr, isBold = false) => {
        if (isBold) {
          doc.font('Helvetica-Bold').fillColor('#111827')
        } else {
          doc.font('Helvetica').fillColor('#4B5563')
        }
        doc.text(label, totalsX, tY, { width: 110 })
        doc.text(valueStr, totalsX + 110, tY, { width: blockWidth - 110, align: 'right' })
        tY += 14
      }

      printTotalRow('Selling Subtotal:', formatCurrency(totals.sellingTotal))

      if (totals.mrpTotal && totals.mrpTotal > totals.sellingTotal) {
        printTotalRow('Total MRP:', formatCurrency(totals.mrpTotal))
        printTotalRow('Catalogue Discount:', `-${formatCurrency(totals.discount)}`)
      }

      printTotalRow('Platform Fee:', formatCurrency(totals.platformFee || 0))
      printTotalRow(
        'Delivery Fee:',
        totals.deliveryFee > 0 ? formatCurrency(totals.deliveryFee) : 'FREE'
      )

      tY += 4
      doc
        .strokeColor('#D1D5DB')
        .lineWidth(1)
        .moveTo(totalsX, tY)
        .lineTo(totalsX + blockWidth, tY)
        .stroke()
      tY += 8

      // Grand Total Highlight
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#111827')
        .text('Grand Total:', totalsX, tY, { width: 110 })
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#C2410C')
        .text(formatCurrency(totals.total), totalsX + 110, tY, {
          width: blockWidth - 110,
          align: 'right',
        })

      y = Math.max(y + 85, tY + 25)

      // 5. FOOTER NOTE
      const footerY = 770
      doc
        .strokeColor('#E5E7EB')
        .lineWidth(0.5)
        .moveTo(margin, footerY)
        .lineTo(pageWidth - margin, footerY)
        .stroke()

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#6B7280')
        .text(
          'Computer-generated invoice. Prices are inclusive of applicable taxes.',
          margin,
          footerY + 8,
          { width: contentWidth, align: 'center' }
        )

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

export default {
  generateInvoicePdf,
}
