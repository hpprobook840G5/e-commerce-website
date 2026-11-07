-- Migration: Admin Catalog (Products), Orders, and Order Items for Sales Analysis
-- Timestamp: 20261107000006
-- Note: Do NOT apply directly from client. Backend service role accesses these tables.

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL CHECK (category IN ('brakes', 'engine', 'chassis', 'tyres', 'exhaust', 'lighting', 'seats', 'handlebars')),
  compatibility TEXT[] DEFAULT '{}',
  price_paise INTEGER NOT NULL CHECK (price_paise > 0),
  mrp_paise INTEGER NOT NULL CHECK (mrp_paise >= price_paise),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  short_description TEXT,
  highlights TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  customer_email TEXT,
  total_paise INTEGER,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  category TEXT,
  unit_price_paise INTEGER,
  quantity INTEGER CHECK (quantity > 0),
  line_total_paise INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

-- Enable Row Level Security (RLS) on all new tables with NO public policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE products IS 'Only the Express backend (service role) accesses this table.';
COMMENT ON TABLE orders IS 'Only the Express backend (service role) accesses this table.';
COMMENT ON TABLE order_items IS 'Only the Express backend (service role) accesses this table.';

-- Trigger for auto-updating products.updated_at
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();
