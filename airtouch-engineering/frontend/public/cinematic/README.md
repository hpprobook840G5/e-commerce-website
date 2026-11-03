# AirTouch Engineering - Cinematic Scroll Rider Asset Specification

This directory holds the pre-rendered image sequence and fallback video assets for the scroll-controlled cinematic experience.

## Asset Requirements
- **Visual Subject**: High-performance motorcycle rider on a dark night road, rear or three-quarter camera angle, with fiery orange/red sparks and trail.
- **Composition**: Rider centered or lower-center so side/corner areas remain dark and clear for the story panels.
- **Framing**: Consistent camera framing throughout the sequence.

## Directory Structure
- `desktop/frame_0001.webp` ... `frame_0120.webp` (16:9, 1920x1080, ~120 frames, quality ~75, ~60-100 KB/frame)
- `mobile/frame_0001.webp` ... `frame_0080.webp` (9:16 portrait, 720x1280, ~70-90 frames, quality ~70, ~25-40 KB/frame)
- `poster.webp`: High-resolution representative still frame used as the reduced-motion and no-WebGL static fallback.
- `rider-scrub.mp4` (optional video fallback): All-intra keyframe video for smooth timeline scrubbing.

## FFmpeg Extraction Commands

### 1. Desktop Image Sequence (16:9 1080p, 30fps)
```bash
ffmpeg -i rider.mp4 -vf "fps=30,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" -c:v libwebp -quality 75 desktop/frame_%04d.webp
```

### 2. Mobile Image Sequence (9:16 Portrait 720x1280, 20fps)
```bash
ffmpeg -i rider.mp4 -vf "fps=20,crop=ih*9/16:ih,scale=720:1280" -c:v libwebp -quality 70 mobile/frame_%04d.webp
```

### 3. Scrub-Friendly Fallback Video (Every frame an I-frame)
```bash
ffmpeg -i rider.mp4 -an -c:v libx264 -g 1 -crf 23 -pix_fmt yuv420p -movflags +faststart rider-scrub.mp4
```

### 4. Poster Frame (Still)
```bash
ffmpeg -ss 00:00:02 -i rider.mp4 -vframes 1 -q:v 2 poster.webp
```

