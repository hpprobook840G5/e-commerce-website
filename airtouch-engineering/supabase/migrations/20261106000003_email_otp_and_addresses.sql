-- Migration: Nodemailer Email OTP & Customer Delivery Addresses Schema
-- Timestamp: 20261106000003
-- Description: Creates the email_otp_codes table for secure HMAC-based OTP verification,
-- extends the customer profiles table, and adds the customer addresses table with
-- Indian courier delivery constraints and Row Level Security (RLS).
--
-- NOTE: Do NOT run directly against live database without user confirmation.

-- ============================================================================
-- 1. Email OTP Codes Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login' CHECK (purpose IN ('login')),
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup index on email and creation timestamp
CREATE INDEX IF NOT EXISTS idx_email_otp_codes_lookup 
  ON email_otp_codes (email, created_at DESC);

-- Enable RLS with NO policies: strictly accessible only by the backend service role
ALTER TABLE email_otp_codes ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE email_otp_codes IS 'Stores HMAC-SHA256 hashed 6-digit OTP verification codes. Only accessible via Supabase Service Role Key bypass. Public and authenticated clients have zero access.';
COMMENT ON COLUMN email_otp_codes.code_hash IS 'HMAC-SHA256 hex digest of (email + ":" + code) using OTP_HMAC_SECRET. Plaintext codes are never stored.';
COMMENT ON COLUMN email_otp_codes.attempts IS 'Counter for failed verification attempts. Code is locked when attempts exceed OTP_MAX_ATTEMPTS.';

-- ============================================================================
-- 2. Extend Profiles Table
-- ============================================================================
-- Ensure profiles table exists with core columns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  mobile TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mobile TEXT;

-- Enforce E.164 format (+91XXXXXXXXXX) check constraint when mobile is not null
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_profiles_mobile_e164;
ALTER TABLE profiles ADD CONSTRAINT check_profiles_mobile_e164
  CHECK (mobile IS NULL OR mobile ~ '^\+91[6-9]\d{9}$');

-- ============================================================================
-- 3. Addresses Table (Courier Delivery Address Book)
-- ============================================================================
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL CHECK (mobile ~ '^\+91[6-9]\d{9}$'),
  line1 TEXT NOT NULL,
  line2 TEXT,
  landmark TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL CHECK (pincode ~ '^[1-9][0-9]{5}$'),
  country TEXT NOT NULL DEFAULT 'India',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index on user_id for fetching customer address books quickly
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses (user_id);

-- Enforce exactly one default address per customer using a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_user_default 
  ON addresses (user_id) 
  WHERE is_default = true;

-- Ensure updated_at trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_addresses_updated_at ON addresses;
CREATE TRIGGER trigger_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. Row Level Security (RLS) on Addresses
-- ============================================================================
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Customers can view only their own addresses
DROP POLICY IF EXISTS "Users can read own addresses" ON addresses;
CREATE POLICY "Users can read own addresses"
  ON addresses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Customers can insert only their own addresses
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
CREATE POLICY "Users can insert own addresses"
  ON addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Customers can update only their own addresses
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
CREATE POLICY "Users can update own addresses"
  ON addresses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Customers can delete only their own addresses
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
CREATE POLICY "Users can delete own addresses"
  ON addresses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT ALL ON addresses TO authenticated;

COMMENT ON TABLE addresses IS 'Customer shipping address book for physical order fulfillment. RLS restricts access to owner, and Express enforces additional ownership checks.';

