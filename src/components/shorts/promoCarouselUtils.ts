/** 캐러셀 index 기준 원형 거리 */
export function circularDistance(i: number, center: number, count: number): number {
  if (count <= 1) return 0;
  const d = Math.abs(i - center);
  return Math.min(d, count - d);
}

export function shouldMountCenterPlayer(i: number, center: number, count: number): boolean {
  return circularDistance(i, center, count) <= 1;
}

/** 확대 5장 스트립 — ±2 썸네일 warm mount */
export function shouldWarmExpandedStripItem(i: number, center: number, count: number): boolean {
  return circularDistance(i, center, count) <= 2;
}

/** 홈 teaser 4장 — farLeft 포함 ±2 warm mount */
export function shouldWarmTeaserStripItem(i: number, center: number, count: number): boolean {
  if (count >= 4) return circularDistance(i, center, count) <= 2;
  return circularDistance(i, center, count) <= 1;
}

export function centerVideoPreload(
  i: number,
  center: number,
  count: number
): "auto" | "metadata" | "none" {
  if (i === center) return "auto";
  if (shouldMountCenterPlayer(i, center, count)) return "metadata";
  return "none";
}

/** Triptych 피크·incoming — center 기준 인접 항목은 auto */
export function peekVideoPreload(
  itemIndex: number,
  centerIndex: number,
  count: number
): "auto" | "metadata" | "none" {
  if (count <= 1) return "metadata";
  if (circularDistance(itemIndex, centerIndex, count) <= 1) return "auto";
  return "metadata";
}
