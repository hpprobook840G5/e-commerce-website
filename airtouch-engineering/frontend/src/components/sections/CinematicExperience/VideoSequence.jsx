import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { CINEMATIC_CONFIG } from './cinematicConfig.js'

/**
 * VideoSequence Component (Fallback)
 * Scrubbed strictly by the master scroll timeline.
 * No autoplay, muted, playsInline, preload="metadata".
 */
const VideoSequence = forwardRef(function VideoSequence({ progressRef }, ref) {
  const videoRef = useRef(null)
  const isMetadataLoaded = useRef(false)
  const seekingRef = useRef(false)
  const targetTimeRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onLoadedMetadata = () => {
      isMetadataLoaded.current = true
    }

    const onSeeked = () => {
      seekingRef.current = false
      if (Math.abs(video.currentTime - targetTimeRef.current) > 0.04) {
        seekTo(targetTimeRef.current)
      }
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('seeked', onSeeked)

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('seeked', onSeeked)
    }
  }, [])

  const seekTo = (time) => {
    const video = videoRef.current
    if (!video || !isMetadataLoaded.current) return

    targetTimeRef.current = time
    if (!seekingRef.current) {
      seekingRef.current = true
      video.currentTime = time
    }
  }

  useImperativeHandle(ref, () => ({
    updateProgress: (progress) => {
      const video = videoRef.current
      if (!video || !isMetadataLoaded.current || !video.duration) return

      const targetTime = progress * video.duration
      seekTo(targetTime)
    },
  }))

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
      <video
        ref={videoRef}
        src={CINEMATIC_CONFIG.videoFallbackPath}
        poster={CINEMATIC_CONFIG.posterPath}
        muted
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
    </div>
  )
})

export default VideoSequence

