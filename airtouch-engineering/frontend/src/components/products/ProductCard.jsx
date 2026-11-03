import { motion } from 'framer-motion'

export default function ProductCard({ title = 'Product Name', price = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 border rounded shadow-sm bg-white"
    >
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-gray-600">${price}</p>
    </motion.div>
  )
}

