/**
 * AirTouch Engineering - Authentication Error Sanitizer
 * Maps Supabase Auth errors, network failures, and internal database codes
 * to safe, generic user-facing responses to prevent account enumeration,
 * credential probing, and internal detail leaks.
 *
 * Always logs raw errors server-side for audit and diagnostics.
 */

export function mapAuthError(error, defaultMessage = 'Authentication failed. Please try again.') {
  if (!error) {
    return {
      status: 400,
      message: defaultMessage,
    }
  }

  // Always log raw error server-side for debugging
  console.error('[Supabase Auth Server Error]:', {
    message: error.message,
    status: error.status,
    code: error.code,
    name: error.name,
  })

  const rawMessage = (error.message || '').toLowerCase()
  const code = (error.code || '').toLowerCase()

  // 1. Rate limiting & SMS quota errors
  if (
    rawMessage.includes('rate limit') ||
    rawMessage.includes('too many requests') ||
    rawMessage.includes('over_sms_send_rate_limit') ||
    code === 'over_request_rate_limit' ||
    code === 'over_sms_send_rate_limit' ||
    error.status === 429
  ) {
    return {
      status: 429,
      message: 'Too many requests. Please wait a few minutes before trying again.',
    }
  }

  // 2. OTP token expired or invalid
  if (
    rawMessage.includes('invalid') && rawMessage.includes('token') ||
    rawMessage.includes('otp') ||
    rawMessage.includes('token has expired') ||
    rawMessage.includes('invalid grant') ||
    code === 'invalid_grant' ||
    code === 'otp_expired'
  ) {
    return {
      status: 400,
      message: 'Invalid or expired verification code. Please request a new OTP.',
    }
  }

  // 3. Password login failures & User not found (Generic failure to prevent enumeration)
  if (
    rawMessage.includes('invalid login credentials') ||
    rawMessage.includes('invalid credentials') ||
    rawMessage.includes('user not found') ||
    rawMessage.includes('user_not_found') ||
    rawMessage.includes('wrong password')
  ) {
    return {
      status: 401,
      message: 'Invalid mobile number or password.',
    }
  }

  // 4. Session / Token expiration
  if (
    rawMessage.includes('jwt expired') ||
    rawMessage.includes('session expired') ||
    code === 'bad_jwt'
  ) {
    return {
      status: 401,
      message: 'Your session has expired. Please log in again.',
    }
  }

  // 5. Default safe response
  return {
    status: error.status && error.status >= 400 && error.status < 500 ? error.status : 400,
    message: defaultMessage,
  }
}

export default mapAuthError

