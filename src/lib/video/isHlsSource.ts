/** Cloudflare Stream HLS manifest or generic .m3u8 */
export function isHlsSource(src: string): boolean {
  if (!src) return false;
  const lower = src.toLowerCase();
  return lower.includes(".m3u8") || lower.includes("/manifest/video");
}
