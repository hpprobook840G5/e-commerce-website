import 'dotenv/config'
import './config/env.js'
import './config/mailer.js'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'

import customerAuthRoutes from './routes/customerAuth.routes.js'
import productsRoutes from './routes/products.routes.js'
import categoriesRoutes from './routes/categories.routes.js'
import cartRoutes from './routes/cart.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import paymentsRoutes from './routes/payments.routes.js'
import usersRoutes from './routes/users.routes.js'
import adminRoutes from './routes/admin.routes.js'
import contactRoutes from './routes/contact.routes.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

app.use(helmet())

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5175,http://127.0.0.1:5175')
  .split(',')
  .map((o) => o.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(null, true) // Allow all in dev for seamless testing
    },
    credentials: true,
  })
)

app.use(cookieParser())
app.use(express.json())

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', apiLimiter)

app.use('/api/customer-auth', customerAuthRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/contact', contactRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 5000

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
  })
}

export default app
