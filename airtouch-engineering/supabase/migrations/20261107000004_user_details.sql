-- Migration: Customer User Details Table
-- Timestamp: 20261107000004
-- Description: Creates the user_details table for standalone customer authentication,
-- storing encrypted bcrypt password hashes, contact info, and courier delivery addresses.
--
-- NOTE: Do NOT run against the live database without explicit confirmation.

-- 1. Create user_details table
CREATE TABLE IF NOT EXISTS user_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT UNIQUE NOT NULL CHECK (mobile ~ '^\+91[6-9][0-9]{9}$'),
  password_hash TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  landmark TEXT,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL CHECK (pincode ~ '^[1-9][0-9]{5}$'),
  country TEXT NOT NULL DEFAULT 'India',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- Documentation comments
COMMENT ON TABLE user_details IS 'Only the Express backend (service role) reads and writes this table. RLS is enabled so the public anon key cannot access customer data.';
COMMENT ON COLUMN user_details.id IS 'Primary key UUID for customer record';
COMMENT ON COLUMN user_details.auth_user_id IS 'Optional foreign key link to auth.users if Supabase Auth is linked in the future';
COMMENT ON COLUMN user_details.email IS 'Unique customer email address stored in lowercase';
COMMENT ON COLUMN user_details.mobile IS 'Unique customer mobile number in Indian E.164 format (+91XXXXXXXXXX)';
COMMENT ON COLUMN user_details.password_hash IS 'Bcrypt password hash with cost factor 12 (never plaintext)';
COMMENT ON COLUMN user_details.address_line1 IS 'Primary street delivery address';
COMMENT ON COLUMN user_details.pincode IS '6-digit Indian postal PIN code';

-- 2. Indexes for fast unique lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_details_email ON user_details (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_details_mobile ON user_details (mobile);

-- 3. Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_details_updated_at ON user_details;
CREATE TRIGGER trigger_user_details_updated_at
  BEFORE UPDATE ON user_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE user_details ENABLE ROW LEVEL SECURITY;

-- Note on RLS Security Model:
-- No public (anon) or authenticated user policies are added.
-- Only the Express backend connecting via Supabase Service Role Key bypasses RLS
-- to read and write customer records securely.
