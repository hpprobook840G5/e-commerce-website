import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'cart route working' })
})

export default router

