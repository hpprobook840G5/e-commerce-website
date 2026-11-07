import { useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { CONTACT_INFO } from '../../config/contactInfo.js'

export default function WhatsAppButton() {
  const location = useLocation()
  const whatsappNumber = CONTACT_INFO.whatsapp.number

  if (!whatsappNumber) return null

  const isProductPage = location.pathname.startsWith('/products/') && location.pathname !== '/products'

  return (
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed ${isProductPage ? 'bottom-24 sm:bottom-6' : 'bottom-6'} right-6 p-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all z-40`}
      aria-label="Contact via WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  )
}
