-- Migration: Email Verification and Password Reset
-- Timestamp: 20261107000005
-- Description: Adds email verification and password reset tracking columns to user_details,
-- creates the email_otps table with HMAC-SHA256 hashed codes, and updates existing users.
--
-- NOTE: Do NOT run against the live database without explicit confirmation.

-- 1. Add verification and password change tracking columns to user_details
ALTER TABLE user_details
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- 2. Grandfather existing users: Mark pre-existing customer accounts as verified
-- so that active users who registered prior to this migration are not locked out.
UPDATE user_details
SET
  email_verified = true,
  email_verified_at = COALESCE(email_verified_at, now())
WHERE email_verified = false;

-- 3. Create email_otps table for signup verification and password reset codes
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('signup_verify', 'password_reset')),
  code_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for rapid lookup of active OTPs by email and purpose
CREATE INDEX IF NOT EXISTS idx_email_otps_email_purpose
  ON email_otps (email, purpose, created_at DESC);

-- 4. Enable Row Level Security (RLS) on email_otps
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- Note on RLS Security Model:
-- No public (anon) or authenticated policies are created.
-- Only the Express backend (service role) accesses this table.
COMMENT ON TABLE email_otps IS 'Only the Express backend (service role) accesses this table.';
