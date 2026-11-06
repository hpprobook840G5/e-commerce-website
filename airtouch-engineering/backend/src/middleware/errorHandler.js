/**
 * AirTouch Engineering - Global Express Error Handler
 * Ensures no internal error details, Supabase error codes, or stack traces
 * are ever leaked to API clients.
 */
export const errorHandler = (err, req, res, next) => {
  const status = Number(err.status) || (res.statusCode !== 200 ? res.statusCode : 500)

  // Unexpected server error (5xx)
  if (status >= 500) {
    console.error('[Unhandled Server Error]:', err.stack || err)
    return res.status(status).json({
      message: status === 503 ? (err.message || 'Service Unavailable') : 'Something went wrong.',
    })
  }

  // Known domain/client error (4xx)
  return res.status(status).json({
    message: err.message || 'Request failed.',
    ...(err.errors ? { errors: err.errors } : {}),
  })
}

export default errorHandler
