export default function MapEmbed() {
  const mapUrl = import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL || ''

  return (
    <div className="w-full h-64 border rounded overflow-hidden">
      <iframe
        src={mapUrl}
        title="Google Maps Location"
        className="w-full h-full border-0"
        loading="lazy"
        allowFullScreen
      />
    </div>
  )
}

