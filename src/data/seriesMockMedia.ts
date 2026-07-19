/**
 * Temporary episodic media used until the series schema and Cloudflare playback
 * records are connected. All thumbnails are local and render immediately; the
 * small public MP4s are fetched only after the viewer presses play.
 */
export const SERIES_MOCK_THUMBNAILS = [
  "/images/home/featured/concrete-bloom.webp",
  "/images/home/featured/sink-or-swim.webp",
  "/images/home/featured/9pm-conversation.webp",
  "/images/home/featured/almost-maine.webp",
  "/images/home/featured/the-first-draft.webp",
  "/images/home/surface/flicker.webp",
  "/images/home/surface/everything-somewhere.webp",
  "/images/home/surface/rooftop-sound.webp",
] as const;

export const SERIES_MOCK_VIDEO_URLS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
] as const;
