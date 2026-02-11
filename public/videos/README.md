# Hero Video Setup

## Instructions

To add your own hero background video:

1. **Video Requirements**:
   - Format: MP4 (H.264 codec) and WebM (VP9 codec) for best browser compatibility
   - Resolution: 1920x1080 (Full HD) or higher
   - Duration: 15-30 seconds (looping)
   - File size: Keep under 5MB for optimal performance
   - Content: Cinematic travel footage (destinations, flights, nature, etc.)

2. **File Placement**:
   - Place your video files in this directory:
     - `hero-travel.mp4` (MP4 format)
     - `hero-travel.webm` (WebM format - optional but recommended)

3. **Poster Image**:
   - Create a poster image (first frame of video or a still image)
   - Place it in `/public/images/hero-poster.jpg`
   - Recommended size: 1920x1080px
   - This image will be shown on mobile devices and as a fallback

4. **Optimization Tips**:
   - Use video compression tools like HandBrake or FFmpeg
   - For MP4: Use H.264 codec, CRF 23-28 for good quality/size balance
   - For WebM: Use VP9 codec for better compression
   - Consider using a service like Cloudinary for video optimization

5. **Example FFmpeg Commands**:
   ```bash
   # Convert to MP4 (H.264)
   ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset slow -c:a aac -b:a 128k hero-travel.mp4
   
   # Convert to WebM (VP9)
   ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 128k hero-travel.webm
   ```

## Current Setup

The video hero component is configured to:
- Auto-play on desktop (muted, looped)
- Show poster image on mobile devices
- Lazy load video when section comes into view
- Fallback to poster image if video fails to load

## Testing

After adding your video files, test:
1. Desktop: Video should autoplay in background
2. Mobile: Poster image should display
3. Slow connection: Poster image should show while video loads
4. Video errors: Should gracefully fallback to poster image

