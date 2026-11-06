/**
 * AirTouch Engineering - High-Performance Motorcycle Spare Parts Catalog Data
 * Single source of truth loaded from products.json.
 * Aligned with the 3D Motorcycle Showcase and real-world superbike / street bike fitments.
 */

import productsData from './products.json'

export const BIKE_TYPES = [
  'All',
  'Superbike',
  'Naked Sport',
  'Adventure (ADV)',
  'Cruiser',
  'Cafe Racer',
  'Dirt / Enduro',
]

export const CATEGORIES = [
  { id: 'all', name: 'All Motorcycle Parts', icon: 'Layers' },
  {
    id: 'headlight',
    name: 'Headlights & Lighting',
    icon: 'Sun',
    aliases: ['light', 'headlight', 'taillight', 'lamp', 'indicator'],
  },
  {
    id: 'exhaust',
    name: 'Exhaust Systems',
    icon: 'Flame',
    aliases: ['exhaust', 'muffler', 'header', 'slip-on', 'pipe'],
  },
  {
    id: 'clutch',
    name: 'Clutch & Gearbox',
    icon: 'Zap',
    aliases: ['clutch', 'gearbox', 'transmission', 'slipper', 'disk', 'disc'],
  },
  {
    id: 'engine',
    name: 'Engine & Performance',
    icon: 'Zap',
    aliases: ['engine', 'piston', 'camshaft', 'filter', 'spark', 'ecu'],
  },
  {
    id: 'brakes',
    name: 'Brakes & Hydraulics',
    icon: 'Wrench',
    aliases: ['brake', 'caliper', 'disc', 'rotor', 'pad', 'brembo'],
  },
  {
    id: 'handlebars',
    name: 'Handlebars & Controls',
    icon: 'Sliders',
    aliases: ['handlebars', 'lever', 'grip', 'mirror', 'throttle', 'clip-on'],
  },
  {
    id: 'seat',
    name: 'Seats & Bodywork',
    icon: 'Layers',
    aliases: ['seat', 'saddle', 'cowl', 'pillion', 'fairing', 'fuel-tank'],
  },
  {
    id: 'tires',
    name: 'Tires & Wheels',
    icon: 'CircleDot',
    aliases: ['tire', 'front-tire', 'rear-tire', 'wheel', 'rim'],
  },
  {
    id: 'chassis',
    name: 'Chassis, Protection & Suspension',
    icon: 'Shield',
    aliases: ['chassis', 'protection', 'cage', 'slider', 'suspension', 'fork', 'damper'],
  },
]

export const BRANDS = [
  'AirTouch Apex',
  'Akrapovič',
  'Brembo Racing',
  'Öhlins Racing',
  'Rekluse Clutch',
  'Yoshimura',
  'EBC Brakes',
  'Pirelli Moto',
  'Rizoma Italy',
  'K&N Engineering',
]

export const PRODUCTS = productsData.products

export function getProductById(id) {
  if (!id) return null
  return PRODUCTS.find((p) => p.id === id || p.slug === id) || null
}

export function getProductBySlug(slug) {
  if (!slug) return null
  return PRODUCTS.find((p) => p.slug === slug || p.id === slug) || null
}

export default PRODUCTS
