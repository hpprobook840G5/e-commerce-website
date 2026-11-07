/**
 * AirTouch Engineering - Dev Only Sales Seeder & Cleaner
 * Usage:
 *   node scripts/seed-dummy-sales.js --confirm
 *   node scripts/seed-dummy-sales.js --clean --confirm
 */

import '../src/config/env.js'
import { supabaseAdmin, isAuthConfigured } from '../src/config/supabase.js'
import crypto from 'crypto'

const isConfirm = process.argv.includes('--confirm')
const isClean = process.argv.includes('--clean')

if (process.env.NODE_ENV === 'production') {
  console.error('[Error] Seed script cannot be run in production environment!')
  process.exit(1)
}

if (!isConfirm) {
  console.log('--- AirTouch Engineering Demo Sales Tool ---')
  console.log('Safety check: You must provide the --confirm flag.')
  console.log('To seed dummy sales: node scripts/seed-dummy-sales.js --confirm')
  console.log('To clean dummy sales: node scripts/seed-dummy-sales.js --clean --confirm')
  process.exit(0)
}

async function run() {
  if (isClean) {
    console.log('[Seed] Cleaning all orders with DEMO- prefix...')
    if (isAuthConfigured && supabaseAdmin) {
      try {
        const { data: demoOrders } = await supabaseAdmin
          .from('orders')
          .select('id')
          .like('order_number', 'DEMO-%')

        if (demoOrders && demoOrders.length > 0) {
          const ids = demoOrders.map((o) => o.id)
          await supabaseAdmin.from('order_items').delete().in('order_id', ids)
          await supabaseAdmin.from('orders').delete().in('id', ids)
          console.log(`[Seed] Successfully deleted ${ids.length} demo orders from database.`)
        } else {
          console.log('[Seed] No database demo orders found to clean.')
        }
      } catch (err) {
        console.warn('[Seed] Database cleanup note:', err.message)
      }
    }
    try {
      const fs = await import('fs')
      const path = await import('path')
      const cachePath = path.resolve('src/data/demo_sales.json')
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath)
      }
    } catch {}
    console.log('[Seed] Clean operation complete.')
    return
  }

  console.log('[Seed] Seeding 30 days of realistic motorcycle component sales...')

  const sampleProducts = [
    { name: 'LumenPro 7" Bi-LED Matrix Projector Headlight', category: 'lighting', price_paise: 499900 },
    { name: 'Titan-X Titanium Slip-On Performance Exhaust', category: 'exhaust', price_paise: 1850000 },
    { name: 'Brembo Stylema Monobloc Radial Brake Caliper Set', category: 'brakes', price_paise: 2499900 },
    { name: 'Öhlins TTX GP Rear Monoshock Absorber', category: 'chassis', price_paise: 3899900 },
    { name: 'Apex TorqSlipper Billet Aluminum Slipper Clutch Kit', category: 'engine', price_paise: 1249900 },
    { name: 'Pirelli Diablo Supercorsa SP V4 Front & Rear Combo', category: 'tyres', price_paise: 1699900 },
    { name: 'Rizoma Aerodynamic Billet Aluminum Clip-On Bars', category: 'handlebars', price_paise: 649900 },
    { name: 'SaddleGel Track Touring Ergonomic Rider Seat', category: 'seats', price_paise: 549900 },
  ]

  const dummyEmails = [
    'arjun.sharma@example.com',
    'rohit.verma@example.com',
    'vikram.singh@example.com',
    'priya.nair@example.com',
    'rahul.mehta@example.com',
    'aditya.patel@example.com',
    'sneha.kulkarni@example.com',
    'karan.deshmukh@example.com',
  ]

  const ordersToInsert = []
  const itemsToInsert = []
  const now = new Date()

  // Generate 45 orders spread over the past 30 days
  for (let i = 0; i < 45; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const hoursAgo = Math.floor(Math.random() * 24)
    const orderDate = new Date(now.getTime() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000)

    const orderId = crypto.randomUUID()
    const orderNumber = `DEMO-${1000 + i}`
    const email = dummyEmails[i % dummyEmails.length]

    // 1 to 3 items per order
    const itemCount = 1 + Math.floor(Math.random() * 2)
    let orderTotalPaise = 0

    for (let j = 0; j < itemCount; j++) {
      const prod = sampleProducts[(i + j) % sampleProducts.length]
      const qty = 1 + (Math.random() > 0.8 ? 1 : 0)
      const lineTotal = prod.price_paise * qty
      orderTotalPaise += lineTotal

      itemsToInsert.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        product_name: prod.name,
        category: prod.category,
        unit_price_paise: prod.price_paise,
        quantity: qty,
        line_total_paise: lineTotal,
      })
    }

    ordersToInsert.push({
      id: orderId,
      order_number: orderNumber,
      customer_email: email,
      total_paise: orderTotalPaise,
      status: 'completed',
      created_at: orderDate.toISOString(),
    })
  }

  if (isAuthConfigured && supabaseAdmin) {
    try {
      const { error: oErr } = await supabaseAdmin.from('orders').insert(ordersToInsert)
      const { error: iErr } = await supabaseAdmin.from('order_items').insert(itemsToInsert)

      if (!oErr && !iErr) {
        console.log(`[Seed] Inserted ${ordersToInsert.length} orders and ${itemsToInsert.length} items into Supabase.`)
      } else {
        console.warn('[Seed] Supabase insert warning (table might be pending migration):', oErr?.message || iErr?.message)
      }
    } catch (err) {
      console.warn('[Seed] Supabase note:', err.message)
    }
  }

  // Also write to dev fallback cache in memory/json for backend service
  try {
    const fs = await import('fs')
    const path = await import('path')
    const cachePath = path.resolve('src/data/demo_sales.json')
    fs.mkdirSync(path.dirname(cachePath), { recursive: true })
    fs.writeFileSync(
      cachePath,
      JSON.stringify({ orders: ordersToInsert, order_items: itemsToInsert }, null, 2),
      'utf-8'
    )
    console.log(`[Seed] Seeded ${ordersToInsert.length} demo orders across 8 categories into fallback cache.`)
  } catch (err) {
    console.warn('[Seed] File cache note:', err.message)
  }

  console.log('[Seed] Seeding completed successfully.')
}

run()
