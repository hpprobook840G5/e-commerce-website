import dotenv from 'dotenv'

dotenv.config()

const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET']

export const validateEnv = () => {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName])

  if (missing.length > 0) {
    console.error(`[Error] Missing required environment variables: ${missing.join(', ')}`)
  }
}

validateEnv()

export default {
  PORT: process.env.PORT || 5000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
}

