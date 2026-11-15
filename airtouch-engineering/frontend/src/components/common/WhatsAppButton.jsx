import { useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'

const DEFAULT_GREETING = "Hi, I'd like to know more about AirTouch Engineering."

/**
 * Builds the direct WhatsApp chat URL with a prefilled greeting message.
 * Accepts numbers with country code (e.g. "919876543210" or "+91 98765 43210").
 * Strips non-digit characters and ensures 10–15 digits (standard E.164 without plus).
 *
 * @param {string} rawNumber - Phone number with country code from env
 * @param {string} greeting - Message to prefill in the chat
 * @returns {string|null} Full wa.me link or null if missing/invalid
 */
export function buildWhatsAppLink(rawNumber, greeting = DEFAULT_GREETING) {
  if (!rawNumber || typeof rawNumber !== 'string') return null
  const cleaned = rawNumber.replace(/\D/g, '').trim()
  if (cleaned.length < 10 || cleaned.length > 15) return null
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(greeting)}`
}

export default function WhatsAppButton() {
  const location = useLocation()
  const rawNumber = import.meta.env.VITE_WHATSAPP_NUMBER
  const whatsappUrl = buildWhatsAppLink(rawNumber)

  if (!whatsappUrl) return null

  const isProductPage = location.pathname.startsWith('/products/') && location.pathname !== '/products'

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed ${isProductPage ? 'bottom-24 sm:bottom-6' : 'bottom-6'} right-6 p-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all z-40 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-zinc-950`}
      aria-label="Chat with AirTouch Engineering on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  )
}
