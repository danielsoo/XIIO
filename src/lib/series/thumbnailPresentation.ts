/**
 * The temporary home artwork is captured from an earlier card mockup, so its
 * source bitmap includes the old card border and caption. Zooming to the clean
 * picture area keeps those baked-in UI fragments outside the 16:9 viewport.
 */
export function isCapturedCardArtwork(src?: string): boolean {
  return Boolean(src?.startsWith("/images/home/"));
}

export function seriesThumbnailClassName(src?: string): string {
  return isCapturedCardArtwork(src)
    ? "scale-[1.34] object-cover object-[center_36%]"
    : "object-cover";
}
