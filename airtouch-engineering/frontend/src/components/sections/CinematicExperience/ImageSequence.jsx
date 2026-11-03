import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { getFrameUrl } from './cinematicConfig.js'

/**
 * ImageSequence Component
 * Draws pre-rendered sequence frames to a 2D canvas with cover-fit math.
 * If real image assets are missing, renders a high-precision dev telemetry placeholder.
 */
const ImageSequence = forwardRef(function ImageSequence(
  { tier, progressRef, onFrameLoadedCount },
  ref
) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const frameCache = useRef(new Map())
  const lastDrawnFrame = useRef(-1)
  const [assetMissing, setAssetMissing] = useState(false)
  const abortControllerRef = useRef(null)

  // Find the nearest loaded frame index
  const getNearestLoadedFrame = useCallback((targetIndex) => {
    if (frameCache.current.has(targetIndex)) {
      return frameCache.current.get(targetIndex)
    }
    // Search outwards from targetIndex
    for (let offset = 1; offset <= tier.frameCount; offset++) {
      if (frameCache.current.has(targetIndex - offset)) {
        return frameCache.current.get(targetIndex - offset)
      }
      if (frameCache.current.has(targetIndex + offset)) {
        return frameCache.current.get(targetIndex + offset)
      }
    }
    return null
  }, [tier.frameCount])

  // Draw developer placeholder when real sequence frames are missing
  const drawDevPlaceholder = useCallback((ctx, width, height, currentFrame, totalFrames) => {
    // 1. Deep asphalt dark gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
    bgGradient.addColorStop(0, '#050507')
    bgGradient.addColorStop(0.5, '#09090b')
    bgGradient.addColorStop(1, '#18181b')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // 2. Faint perspective road grid
    ctx.save()
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.12)'
    ctx.lineWidth = 1.5

    const horizonY = height * 0.45
    const vanishX = width * 0.5

    // Perspective lines
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath()
      ctx.moveTo(vanishX + i * (width * 0.05), horizonY)
      ctx.lineTo(vanishX + i * (width * 0.2), height)
      ctx.stroke()
    }

    // Horizontal distance lines
    for (let j = 1; j <= 8; j++) {
      const lineY = horizonY + Math.pow(j / 8, 2) * (height - horizonY)
      ctx.beginPath()
      ctx.moveTo(0, lineY)
      ctx.lineTo(width, lineY)
      ctx.stroke()
    }
    ctx.restore()

    // 3. Central Rider Silhouette & Wireframe Target
    ctx.save()
    const centerX = width * 0.5
    const centerY = height * 0.62
    const targetSize = Math.min(width, height) * 0.28

    // Target box brackets
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.45)'
    ctx.lineWidth = 2
    const bracketLen = 20

    // Top-left
    ctx.beginPath()
    ctx.moveTo(centerX - targetSize * 0.5, centerY - targetSize * 0.5 + bracketLen)
    ctx.lineTo(centerX - targetSize * 0.5, centerY - targetSize * 0.5)
    ctx.lineTo(centerX - targetSize * 0.5 + bracketLen, centerY - targetSize * 0.5)
    ctx.stroke()

    // Top-right
    ctx.beginPath()
    ctx.moveTo(centerX + targetSize * 0.5 - bracketLen, centerY - targetSize * 0.5)
    ctx.lineTo(centerX + targetSize * 0.5, centerY - targetSize * 0.5)
    ctx.lineTo(centerX + targetSize * 0.5, centerY - targetSize * 0.5 + bracketLen)
    ctx.stroke()

    // Bottom-left
    ctx.beginPath()
    ctx.moveTo(centerX - targetSize * 0.5, centerY + targetSize * 0.5 - bracketLen)
    ctx.lineTo(centerX - targetSize * 0.5, centerY + targetSize * 0.5)
    ctx.lineTo(centerX - targetSize * 0.5 + bracketLen, centerY + targetSize * 0.5)
    ctx.stroke()

    // Bottom-right
    ctx.beginPath()
    ctx.moveTo(centerX + targetSize * 0.5 - bracketLen, centerY + targetSize * 0.5)
    ctx.lineTo(centerX + targetSize * 0.5, centerY + targetSize * 0.5)
    ctx.lineTo(centerX + targetSize * 0.5, centerY + targetSize * 0.5 - bracketLen)
    ctx.stroke()

    // Central crosshair & text
    ctx.fillStyle = '#f97316'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('RIDER FOCUS ZONE', centerX, centerY - targetSize * 0.5 - 12)

    // Motorcycle silhouette polygon placeholder
    ctx.fillStyle = 'rgba(24, 24, 27, 0.85)'
    ctx.strokeStyle = '#f97316'
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - targetSize * 0.4)
    ctx.lineTo(centerX + targetSize * 0.35, centerY + targetSize * 0.35)
    ctx.lineTo(centerX - targetSize * 0.35, centerY + targetSize * 0.35)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.restore()

    // 4. Status HUD Badge
    ctx.save()
    ctx.fillStyle = 'rgba(9, 9, 11, 0.85)'
    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 1.5
    const badgeW = Math.min(width * 0.85, 420)
    const badgeH = 80
    const badgeX = (width - badgeW) * 0.5
    const badgeY = 32

    ctx.fillRect(badgeX, badgeY, badgeW, badgeH)
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH)

    ctx.fillStyle = '#f97316'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('AIRTOUCH CINEMATIC SCROLL ENGINE', centerX, badgeY + 24)

    ctx.fillStyle = '#a1a1aa'
    ctx.font = '11px monospace'
    ctx.fillText('RIDER ASSET MISSING — DEV TELEMETRY MODE', centerX, badgeY + 44)

    const progressPct = ((currentFrame / totalFrames) * 100).toFixed(1)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`FRAME: ${currentFrame} / ${totalFrames}  |  SCROLL: ${progressPct}%  |  TIER: ${tier.name.toUpperCase()}`, centerX, badgeY + 64)
    ctx.restore()

    // 5. Bottom Glowing Orange Progress Rail
    const railHeight = 4
    ctx.fillStyle = 'rgba(39, 39, 42, 0.6)'
    ctx.fillRect(0, height - railHeight, width, railHeight)

    const progressWidth = (currentFrame / totalFrames) * width
    ctx.fillStyle = '#f97316'
    ctx.shadowColor = '#f97316'
    ctx.shadowBlur = 10
    ctx.fillRect(0, height - railHeight, progressWidth, railHeight)
  }, [tier.name])

  // Core render function called when rounded frame index changes
  const renderFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const clampedIndex = Math.max(1, Math.min(frameIndex, tier.frameCount))

    if (assetMissing) {
      drawDevPlaceholder(ctx, width, height, clampedIndex, tier.frameCount)
      lastDrawnFrame.current = clampedIndex
      return
    }

    const img = getNearestLoadedFrame(clampedIndex)
    if (!img) {
      // Fall back to placeholder if no frames loaded yet
      drawDevPlaceholder(ctx, width, height, clampedIndex, tier.frameCount)
      lastDrawnFrame.current = clampedIndex
      return
    }

    // Cover-fit math (retains aspect ratio, fills entire canvas without stretching)
    const scale = Math.max(width / img.width, height / img.height)
    const x = (width - img.width * scale) * 0.5
    const y = (height - img.height * scale) * 0.5

    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
    lastDrawnFrame.current = clampedIndex
  }, [assetMissing, drawDevPlaceholder, getNearestLoadedFrame, tier.frameCount])

  // Expose draw method to master timeline
  useImperativeHandle(ref, () => ({
    draw: (frameIndex) => {
      const rounded = Math.round(frameIndex)
      if (rounded !== lastDrawnFrame.current) {
        renderFrame(rounded)
      }
    },
    resize: () => {
      handleResize()
    },
  }))

  // Handle canvas sizing with devicePixelRatio and tier cap
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, tier.dprCap)

    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    renderFrame(lastDrawnFrame.current > 0 ? lastDrawnFrame.current : 1)
  }, [tier.dprCap, renderFrame])

  // Progressive frame loader: keyframes (every 6th) first, then remaining
  useEffect(() => {
    const controller = new AbortController()
    abortControllerRef.current = controller
    frameCache.current.clear()
    lastDrawnFrame.current = -1

    let loadedCount = 0

    // Load a single frame via img.decode()
    const loadFrame = (index) => {
      return new Promise((resolve) => {
        if (controller.signal.aborted) return resolve(false)

        const img = new Image()
        img.src = getFrameUrl(index, tier)

        img
          .decode()
          .then(() => {
            if (!controller.signal.aborted) {
              frameCache.current.set(index, img)
              loadedCount++
              if (onFrameLoadedCount) {
                onFrameLoadedCount(loadedCount)
              }
              resolve(true)
            }
          })
          .catch(() => {
            // First frame failure triggers dev placeholder
            if (index === 1) {
              setAssetMissing(true)
            }
            resolve(false)
          })
      })
    }

    // Step 1: Probe Frame 1
    loadFrame(1).then((success) => {
      if (!success) {
        setAssetMissing(true)
        handleResize()
        return
      }

      setAssetMissing(false)
      handleResize()

      // Step 2: Load keyframes (every 6th frame)
      const keyframeIndices = []
      for (let i = 2; i <= tier.frameCount; i += 6) {
        keyframeIndices.push(i)
      }

      Promise.all(keyframeIndices.map(loadFrame)).then(() => {
        if (controller.signal.aborted) return

        // Step 3: Background fill the remaining frames
        const remainingIndices = []
        for (let i = 2; i <= tier.frameCount; i++) {
          if (!frameCache.current.has(i)) {
            remainingIndices.push(i)
          }
        }
        remainingIndices.reduce((p, index) => {
          return p.then(() => loadFrame(index))
        }, Promise.resolve())
      })
    })

    return () => {
      controller.abort()
    }
  }, [tier, onFrameLoadedCount, handleResize])

  // Canvas ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver(() => {
      handleResize()
    })
    ro.observe(container)

    return () => ro.disconnect()
  }, [handleResize])

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block object-cover"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
})

export default ImageSequence

