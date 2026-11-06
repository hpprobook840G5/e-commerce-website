-- Migration: Create contact_messages table for AirTouch Engineering customer inquiries
-- Timestamp: 20261106000000

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  topic TEXT NOT NULL CHECK (topic IN ('order_help', 'product_fitment', 'bulk_dealer', 'returns', 'other')),
  order_id TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comments on table and columns
COMMENT ON TABLE contact_messages IS 'Customer inquiries submitted via the AirTouch Engineering Contact Us page';
COMMENT ON COLUMN contact_messages.topic IS 'Inquiry category: order_help, product_fitment, bulk_dealer, returns, other';
COMMENT ON COLUMN contact_messages.status IS 'Resolution lifecycle state: new, in_progress, resolved';
COMMENT ON COLUMN contact_messages.ip_hash IS 'Salted SHA-256 hash of submitter IP address for privacy-safe abuse mitigation';

-- Enable Row Level Security (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Security Policy:
-- NO public anon or authenticated policies are created.
-- By default with RLS enabled and zero policies, all direct requests via Supabase client (anon/user tokens) are rejected.
-- Only the backend Express server using the Supabase Service Role Key bypasses RLS to insert and read messages.

-- Indexes for performant filtering and pagination
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_status
  ON contact_messages (created_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_contact_messages_topic
  ON contact_messages (topic);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contact_messages_updated_at ON contact_messages;
CREATE TRIGGER trigger_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_messages_updated_at();

