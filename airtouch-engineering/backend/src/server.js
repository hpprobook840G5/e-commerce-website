import 'dotenv/config'
import './config/env.js'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.routes.js'
import productsRoutes from './routes/products.routes.js'
import categoriesRoutes from './routes/categories.routes.js'
import cartRoutes from './routes/cart.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import paymentsRoutes from './routes/payments.routes.js'
import usersRoutes from './routes/users.routes.js'
import adminRoutes from './routes/admin.routes.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', apiLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/admin', adminRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

export default app

