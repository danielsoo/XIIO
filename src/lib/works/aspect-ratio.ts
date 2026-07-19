import type { VideoAspectRatio, WorkSection } from "@/types/work";
import { WORK_ASPECT_RATIOS } from "@/types/work";

export function isVideoAspectRatio(value: string): value is VideoAspectRatio {
  return (WORK_ASPECT_RATIOS as readonly string[]).includes(value);
}

export function defaultAspectRatioForSection(section: WorkSection): VideoAspectRatio {
  return section === "shorts" ? "9:16" : "16:9";
}

/** Width / height for layout hints */
export function aspectRatioNumeric(id: VideoAspectRatio): number {
  const [w, h] = id.split(":").map(Number);
  if (!h) return 16 / 9;
  return w / h;
}

export function closestVideoAspectRatio(width: number, height: number): VideoAspectRatio {
  if (!(width > 0) || !(height > 0)) return "16:9";
  const actual = width / height;
  return WORK_ASPECT_RATIOS.reduce((closest, candidate) => {
    const closestDelta = Math.abs(aspectRatioNumeric(closest) - actual);
    const candidateDelta = Math.abs(aspectRatioNumeric(candidate) - actual);
    return candidateDelta < closestDelta ? candidate : closest;
  }, WORK_ASPECT_RATIOS[0]);
}

export function videoDimensionsMatchAspectRatio(
  width: number,
  height: number,
  ratio: VideoAspectRatio,
  tolerance = 0.04
): boolean {
  if (!(width > 0) || !(height > 0)) return false;
  const actual = width / height;
  const expected = aspectRatioNumeric(ratio);
  return Math.abs(actual - expected) / expected <= tolerance;
}

/** i18n path (colons are not valid in dot-separated keys) */
export function aspectRatioMessageKey(id: VideoAspectRatio): string {
  const map: Record<VideoAspectRatio, string> = {
    "16:9": "works.aspectRatio.r169",
    "9:16": "works.aspectRatio.r916",
    "4:3": "works.aspectRatio.r43",
    "1:1": "works.aspectRatio.r11",
    "21:9": "works.aspectRatio.r219",
  };
  return map[id];
}
