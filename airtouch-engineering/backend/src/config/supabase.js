import { createClient } from '@supabase/supabase-js'
import env, { isAuthConfigured } from './env.js'

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
}

/**
 * Public Anon Supabase Client.
 * Used exclusively for customer-facing authentication actions:
 * OTP requests, OTP verifications, and password logins.
 */
export const supabaseAnon =
  env.SUPABASE_URL && env.SUPABASE_ANON_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, clientOptions)
    : null

/**
 * Privileged Service Role Supabase Client.
 * Used strictly by the Express business-logic layer for:
 * User session token verifications, profile provisioning, password assignments, and revocations.
 *
 * NOTE: Never import supabaseAdmin directly into route handlers or expose raw errors to clients.
 */
export const supabaseAdmin =
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, clientOptions)
    : null

// Re-export configuration status helper
export { isAuthConfigured }

// Backward compatibility alias for contactService and other existing modules
export const supabase = supabaseAdmin
export default supabaseAdmin
