import { MessageCircle } from 'lucide-react'

export default function WhatsAppButton() {
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || ''

  return (
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 p-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors"
      aria-label="Contact via WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  )
}

