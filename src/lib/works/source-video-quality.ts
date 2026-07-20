export const CURRENT_PLAYBACK_MAX_HEIGHT = 1080 as const;

export type SourceVideoQuality =
  | "sd"
  | "hd"
  | "full_hd"
  | "2k"
  | "4k"
  | "8k";

/**
 * Classifies both landscape and portrait masters by their shorter edge.
 * This keeps a 3840×2160 and a 2160×3840 source in the same 4K tier.
 */
export function classifySourceVideoQuality(
  width: number,
  height: number
): SourceVideoQuality {
  const shortEdge = Math.min(width, height);
  if (shortEdge >= 4320) return "8k";
  if (shortEdge >= 2160) return "4k";
  if (shortEdge >= 1440) return "2k";
  if (shortEdge >= 1080) return "full_hd";
  if (shortEdge >= 720) return "hd";
  return "sd";
}

export function sourceVideoQualityLabel(quality: SourceVideoQuality): string {
  switch (quality) {
    case "8k":
      return "8K";
    case "4k":
      return "4K";
    case "2k":
      return "1440p";
    case "full_hd":
      return "1080p";
    case "hd":
      return "720p";
    default:
      return "SD";
  }
}

export function supportsFutureHighResolutionDelivery(
  quality: SourceVideoQuality
): boolean {
  return quality === "2k" || quality === "4k" || quality === "8k";
}
