-- Migration: Email & Google OAuth Customer Authentication Schema
-- Timestamp: 20261106000002
-- Description: Updates the profiles table to use email as the unique primary identifier.
-- Makes mobile optional/nullable with E.164 validation. Grants column-level update permissions
-- for full_name and mobile while restricting email and role.

-- 1. Add email column to profiles if it does not already exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Populate email from auth.users where missing
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id
  AND (profiles.email IS NULL OR profiles.email = '');

-- 3. Enforce lowercase, trimmed, NOT NULL, and UNIQUE on profiles.email
UPDATE profiles SET email = LOWER(TRIM(email)) WHERE email IS NOT NULL;

DO $$
BEGIN
  -- Add not-null constraint if not already set
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;
  END IF;
END $$;

-- Drop and recreate unique constraint on email
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_unique;
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- 4. Alter mobile column: nullable, drop uniqueness constraint
ALTER TABLE profiles ALTER COLUMN mobile DROP NOT NULL;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_mobile_key;

-- 5. Add check constraint for E.164 Indian mobile format when present (+91XXXXXXXXXX)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_profiles_mobile_e164;
ALTER TABLE profiles ADD CONSTRAINT check_profiles_mobile_e164
  CHECK (mobile IS NULL OR mobile ~ '^\+91[6-9]\d{9}$');

-- 6. Indexes for performant lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON profiles (mobile) WHERE mobile IS NOT NULL;

-- 7. Ensure updated_at trigger is active
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

-- 8. Row Level Security & Column-level GRANT
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Select own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Update own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Column-level permissions:
-- Authenticated users can SELECT all columns.
-- Authenticated users can UPDATE ONLY full_name and mobile.
-- Email and role are strictly immutable by the user.
GRANT SELECT ON profiles TO authenticated;
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name, mobile) ON profiles TO authenticated;

-- Comments explaining security model
COMMENT ON TABLE profiles IS 'Customer profiles for AirTouch Engineering. The Express backend connects with the Supabase Service Role Key which bypasses RLS. Express enforces ownership, rate-limiting, and validation checks explicitly.';
COMMENT ON COLUMN profiles.email IS 'Customer primary email address (unique, mandatory, non-updatable by user)';
COMMENT ON COLUMN profiles.mobile IS 'Optional customer contact mobile number in E.164 format (+91XXXXXXXXXX), updatable by user';

