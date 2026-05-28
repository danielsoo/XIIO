export const PROMO_MIN_DURATION_SEC = 3;
export const PROMO_MAX_DURATION_SEC = 120;

export type PromoVideoDurationError = "invalid_duration" | "too_short" | "too_long";
export type PromoVideoAspectError =
  | "invalid_dimensions"
  | "too_small";

export const PROMO_MIN_DIMENSION_PX = 360;

export function isPortraitVideo(width: number, height: number): boolean {
  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0 &&
    height > width
  );
}

export function isPromoAspectRatio(width: number, height: number): boolean {
  return isPortraitVideo(width, height);
}

export function validatePromoVideoDuration(sec: number): PromoVideoDurationError | null {
  if (!Number.isFinite(sec) || sec <= 0) return "invalid_duration";
  if (sec < PROMO_MIN_DURATION_SEC) return "too_short";
  if (sec > PROMO_MAX_DURATION_SEC) return "too_long";
  return null;
}

export function validatePromoVideoDimensions(
  width: number,
  height: number
): PromoVideoAspectError | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return "invalid_dimensions";
  }
  if (Math.min(width, height) < PROMO_MIN_DIMENSION_PX) return "too_small";
  return null;
}

/** Legacy clip-based promos were cut from full work (non-zero start) */
export function isLegacyClipPromo(clipStartSec?: number): boolean {
  return typeof clipStartSec === "number" && clipStartSec > 0.5;
}
