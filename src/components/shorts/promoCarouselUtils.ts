/** 캐러셀 index 기준 원형 거리 */
export function circularDistance(i: number, center: number, count: number): number {
  if (count <= 1) return 0;
  const d = Math.abs(i - center);
  return Math.min(d, count - d);
}

export function shouldMountCenterPlayer(i: number, center: number, count: number): boolean {
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
