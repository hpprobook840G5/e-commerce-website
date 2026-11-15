-- ==============================================================================
-- Migration: Order Workflow Enhancements
-- Description: Alters the `orders` table to support customer orders (request, cod, upi),
--              snapshots customer and shipping details, tracks status transitions,
--              and provides idempotency and notification timestamps.
-- Target Table: orders
-- Security: Maintains Row Level Security (RLS) enabled with no public policies.
--           All database operations must be executed via Express service role.
-- ==============================================================================

-- 1. Alter status column default to 'pending' and enforce valid status values
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';

-- Add status check constraint if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_status'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT chk_orders_status CHECK (status IN ('pending', 'completed'));
  END IF;
END $$;

-- 2. Add workflow, customer snapshot, pricing, and notification columns to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'request' CHECK (order_type IN ('request', 'cod', 'upi')),
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES user_details(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_mobile TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address JSONB,
  ADD COLUMN IF NOT EXISTS subtotal_paise INTEGER,
  ADD COLUMN IF NOT EXISTS mrp_total_paise INTEGER,
  ADD COLUMN IF NOT EXISTS platform_fee_paise INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee_paise INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upi_reference TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- NOTE ON DEMO ROWS:
-- Existing demo rows (prefixed with 'DEMO-') retain their current 'completed' status
-- and will receive the default order_type 'request'. They must not be forced to 'cod'.

-- 3. Performance indexes for order status queries and customer lookup
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);

-- 4. Verify RLS is enabled with no public policies (accessed only via Express service role)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
