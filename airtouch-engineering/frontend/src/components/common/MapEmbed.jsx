import { CONTACT_INFO } from '../../config/contactInfo.js'

export default function MapEmbed() {
  const mapUrl = CONTACT_INFO.maps.embedUrl

  if (!mapUrl) {
    return (
      <div className="w-full h-64 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Location Map
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          {CONTACT_INFO.address.full}
        </p>
        <a
          href={CONTACT_INFO.maps.directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider hover:bg-orange-500/20 transition-colors"
        >
          Open in Google Maps
        </a>
      </div>
    )
  }

  return (
    <div className="w-full h-64 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={mapUrl}
        title="Google Maps Location - AirTouch Engineering"
        className="w-full h-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
