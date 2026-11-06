import { MessageCircle } from 'lucide-react'
import { CONTACT_INFO } from '../../config/contactInfo.js'

export default function WhatsAppButton() {
  const whatsappNumber = CONTACT_INFO.whatsapp.number

  if (!whatsappNumber) return null

  return (
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 p-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors z-40"
      aria-label="Contact via WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  )
}
