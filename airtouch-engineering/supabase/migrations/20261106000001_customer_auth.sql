-- Migration: Customer Authentication Schema & Profiles Table
-- Timestamp: 20261106000001
-- Description: Creates the customer profiles table, updated_at trigger, indexes,
-- and Row Level Security (RLS) policies for AirTouch Engineering customer authentication.

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  mobile TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documentation comments
COMMENT ON TABLE profiles IS 'Customer profiles linked 1:1 with auth.users. The Express backend service role bypasses RLS, so Express must enforce all ownership, rate-limiting, and validation checks itself.';
COMMENT ON COLUMN profiles.id IS 'Primary key referencing auth.users(id) with cascade delete';
COMMENT ON COLUMN profiles.full_name IS 'Customer display/shipping full name (optional during initial OTP sign-up, updatable by authenticated user)';
COMMENT ON COLUMN profiles.mobile IS 'Customer mobile number stored in E.164 format (+91XXXXXXXXXX), unique across all customer accounts';
COMMENT ON COLUMN profiles.role IS 'Authorization role, defaults to customer. Immutable by users';

-- 2. Fast lookup index on normalized mobile number
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON profiles (mobile);

-- 3. Reusable Trigger Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
-- Policy: Authenticated users can select their own profile row only
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Authenticated users can update their own profile row only
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. Column-level permissions
-- Grant select on all columns to authenticated users
GRANT SELECT ON profiles TO authenticated;

-- Restrict updatable columns with a column-level GRANT so authenticated users
-- can only update full_name, preventing tampering with role, id, or mobile.
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name) ON profiles TO authenticated;

-- Security Note:
-- No INSERT or DELETE policies are granted to 'anon' or 'authenticated' roles.
-- Account provisioning and profile inserts happen exclusively through the Express backend
-- using the Supabase Service Role Key. Express must enforce ownership checks explicitly.

