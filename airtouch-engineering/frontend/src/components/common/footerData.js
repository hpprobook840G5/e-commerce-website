// TODO: replace placeholder links and business details with real values before launch.

import { CLICKABLE_PARTS } from '../sections/CinematicExperience/cinematicConfig.js'
import { CONTACT_INFO } from '../../config/contactInfo.js'

/**
 * Resolves the canonical category URL from CLICKABLE_PARTS (single source of truth
 * shared with the 3D showcase and Products page), falling back to /products?category=<slug>.
 */
function getCategoryUrl(partId, fallbackSlug = partId) {
  const matched = CLICKABLE_PARTS.find((part) => part.id === partId)
  return matched ? matched.url : `/products?category=${fallbackSlug}`
}

export const FOOTER_DATA = {
  brand: {
    namePrimary: 'AirTouch',
    nameAccent: '.',
    nameSecondary: 'Engineering',
    tagline: 'Precision parts for every ride.',
    description:
      'Genuine motorcycle spare parts, performance components, and accessories, built for riders who demand more.',
    // TODO: Confirm owner-approved regional tagline before launch; set to '' to hide.
    madeInLine: 'Made in Kerala · Engineered for every road',
  },

  // Social media links read from Vite environment variables (hidden when empty)
  getSocialLinks: (env = import.meta.env) =>
    [
      {
        id: 'instagram',
        name: 'Instagram',
        ariaLabel: 'AirTouch on Instagram',
        href: (env.VITE_INSTAGRAM_URL || '').trim(),
      },
      {
        id: 'facebook',
        name: 'Facebook',
        ariaLabel: 'AirTouch on Facebook',
        href: (env.VITE_FACEBOOK_URL || '').trim(),
      },
      {
        id: 'youtube',
        name: 'YouTube',
        ariaLabel: 'AirTouch on YouTube',
        href: (env.VITE_YOUTUBE_URL || '').trim(),
      },
    ].filter((item) => Boolean(item.href)),

  // Business compliance details required for Razorpay & Indian e-commerce regulations (hidden when empty)
  getBusinessDetails: (env = import.meta.env) =>
    [
      {
        id: 'legalName',
        label: 'Legal Name',
        value: (env.VITE_BUSINESS_LEGAL_NAME || '').trim(),
      },
      {
        id: 'gstin',
        label: 'GSTIN',
        value: (env.VITE_GSTIN || '').trim(),
      },
      {
        id: 'registeredAddress',
        label: 'Registered Office',
        value: (env.VITE_REGISTERED_ADDRESS || CONTACT_INFO.address.full || '').trim(),
      },
      {
        id: 'supportEmail',
        label: 'Support Email',
        value: (env.VITE_SUPPORT_EMAIL || CONTACT_INFO.email.full || '').trim(),
      },
      {
        id: 'supportPhone',
        label: 'Support Phone',
        value: (env.VITE_SUPPORT_PHONE || CONTACT_INFO.phone.display || '').trim(),
      },
    ].filter((item) => Boolean(item.value)),

  columns: [
    {
      id: 'shop',
      heading: 'Shop',
      links: [
        { label: 'Brakes', to: getCategoryUrl('brakes', 'brakes') },
        { label: 'Engine', to: getCategoryUrl('engine', 'engine') },
        { label: 'Chassis', to: getCategoryUrl('chassis', 'chassis') },
        { label: 'Tyres', to: getCategoryUrl('front-tire', 'front-tire') },
        { label: 'Exhaust', to: getCategoryUrl('exhaust', 'exhaust') },
        { label: 'Lighting', to: getCategoryUrl('headlight', 'headlight') },
        { label: 'Seats', to: getCategoryUrl('seat', 'seat') },
        { label: 'Handlebars', to: getCategoryUrl('handlebars', 'handlebars') },
      ],
    },
    {
      id: 'help',
      heading: 'Help',
      links: [
        { label: 'Track Order', to: '/orders' },
        { label: 'Shipping Policy', to: '/shipping' },
        { label: 'Returns & Exchanges', to: '/returns' },
        { label: 'Warranty', to: '/warranty' },
        { label: 'FAQs', to: '/faq' },
      ],
    },
    {
      id: 'company',
      heading: 'Company',
      links: [
        { label: 'About Us', to: '/about' },
        { label: 'Contact', to: '/contact' },
        { label: 'Careers', to: '/careers' },
      ],
    },
  ],

  legalLinks: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Refund Policy', to: '/refund' },
  ],

  copyrightNotice: (year) => `© ${year} AirTouch Engineering. All rights reserved.`,
}

