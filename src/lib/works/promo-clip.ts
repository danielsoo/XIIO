export type PromoTrimRange = {
  startSec: number;
  endSec: number;
};

/** 홍보 쇼츠 클립 구간 검증 — null이면 유효 */
export function validatePromoClipRange(
  start: number,
  end: number,
  maxDuration?: number
): string | null {
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return "invalid_clip";
  }
  if (end <= start || end - start < 3) {
    return "clip_too_short";
  }
  if (end - start > 120) {
    return "clip_too_long";
  }
  if (maxDuration != null && maxDuration > 0 && end > maxDuration + 0.5) {
    return "clip_exceeds_duration";
  }
  return null;
}

export function defaultPromoClipEnd(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 30;
  return Math.min(30, Math.max(3, duration));
}
