import { motion } from 'framer-motion'

export default function CartItem({ item = { title: 'Cart Item', price: 0, quantity: 1 } }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-between items-center p-3 border-b"
    >
      <div>
        <p className="font-medium">{item.title}</p>
        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
      </div>
      <span className="font-semibold">${item.price}</span>
    </motion.div>
  )
}

