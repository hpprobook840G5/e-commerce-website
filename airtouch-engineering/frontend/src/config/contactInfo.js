// TODO: replace placeholder contact details before launch.

const env = import.meta.env || {}

const rawPhone = (env.VITE_SUPPORT_PHONE || '+91 90000 00000').trim()
const rawWhatsapp = (env.VITE_WHATSAPP_NUMBER || '919000000000').replace(/\D/g, '').trim()
const rawEmail = (env.VITE_SUPPORT_EMAIL || 'hello@airtouchengineering.in').trim()
const rawAddress = (env.VITE_REGISTERED_ADDRESS || 'Unit 14, Industrial Estate, NH-66 Bypass, Calicut, Kerala 673014, India').trim()

const emailParts = rawEmail.split('@')
const emailUser = emailParts[0] || 'hello'
const emailDomain = emailParts[1] || 'airtouchengineering.in'

export const CONTACT_INFO = {
  // Brand & Response Time
  responseTime: 'We reply within one working day.',
  description: 'Have a question about parts, compatibility, or bulk orders? Our team replies within one working day.',

  // WhatsApp
  whatsapp: {
    number: rawWhatsapp,
    url: rawWhatsapp ? `https://wa.me/${rawWhatsapp}` : '',
    display: rawWhatsapp ? `+${rawWhatsapp.slice(0, 2)} ${rawWhatsapp.slice(2, 7)} ${rawWhatsapp.slice(7)}` : '',
  },

  // Phone
  phone: {
    display: rawPhone,
    dial: rawPhone.replace(/[^\d+]/g, ''),
  },

  // Email
  email: {
    full: rawEmail,
    user: emailUser,
    domain: emailDomain,
    mailto: `mailto:${rawEmail}`,
  },

  // Office Address
  address: {
    line1: 'Unit 14, Industrial Estate, NH-66 Bypass',
    line2: 'Calicut, Kerala 673014, India',
    city: 'Calicut',
    state: 'Kerala',
    postalCode: '673014',
    country: 'India',
    full: rawAddress,
  },

  // Google Maps Links
  maps: {
    directionsUrl: (env.VITE_GOOGLE_MAPS_URL || 'https://maps.google.com/?q=Calicut,+Kerala,+India').trim(),
    embedUrl: (env.VITE_GOOGLE_MAPS_EMBED_URL || '').trim(),
  },

  // Working Hours (Structured data)
  workingHours: {
    timezone: 'Asia/Kolkata',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    daysLabel: 'Mon–Sat',
    openTime: '9:30 am',
    closeTime: '6:30 pm',
    openMinutes: 9 * 60 + 30, // 570 mins
    closeMinutes: 18 * 60 + 30, // 1110 mins
    workDays: [1, 2, 3, 4, 5, 6], // 1 = Mon, 6 = Sat, 0 = Sun
    label: 'Mon–Sat · 9:30 am to 6:30 pm IST',
  },
}

const WEEKDAY_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

/**
 * Computes live "Open now" / "Closed · opens [time]" status in Asia/Kolkata timezone using Intl API.
 */
export function getWorkingHoursLiveStatus(now = new Date()) {
  const schedule = CONTACT_INFO.workingHours

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const formattedTime = timeFormatter.format(now).toLowerCase()

  const partsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const parts = partsFormatter.formatToParts(now)
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value || 'Mon'
  const rawHour = Number(parts.find((p) => p.type === 'hour')?.value || 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0)

  const dayIndex = WEEKDAY_INDEX[weekdayStr] ?? 1
  const hour24 = rawHour === 24 ? 0 : rawHour
  const currentMinutes = hour24 * 60 + minute

  const isWorkDay = schedule.workDays.includes(dayIndex)
  const isOpen =
    isWorkDay &&
    currentMinutes >= schedule.openMinutes &&
    currentMinutes < schedule.closeMinutes

  let statusText = ''
  if (isOpen) {
    statusText = 'Open now'
  } else if (isWorkDay && currentMinutes < schedule.openMinutes) {
    statusText = `Closed · opens ${schedule.openTime}`
  } else {
    // If closed in evening or Sunday, opens next working day at openTime
    statusText = `Closed · opens ${schedule.openTime}`
  }

  return {
    isOpen,
    statusText,
    formattedTime,
    timezone: schedule.timezone,
  }
}

export default CONTACT_INFO

