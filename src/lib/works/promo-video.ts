/** Target portrait ratio 9:16 */
export const PROMO_ASPECT_RATIO_MIN = 9 / 16;
/** Allow up to 4:5 portrait (w/h = 0.8) */
export const PROMO_ASPECT_RATIO_MAX = 4 / 5;

export const PROMO_MIN_DURATION_SEC = 3;
export const PROMO_MAX_DURATION_SEC = 120;

export type PromoVideoDurationError = "invalid_duration" | "too_short" | "too_long";
export type PromoVideoAspectError =
  | "invalid_dimensions"
  | "not_portrait"
  | "aspect_ratio_out_of_range";

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
  if (!isPortraitVideo(width, height)) return false;
  const ratio = width / height;
  return ratio >= PROMO_ASPECT_RATIO_MIN && ratio <= PROMO_ASPECT_RATIO_MAX;
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
  if (!isPortraitVideo(width, height)) return "not_portrait";
  if (!isPromoAspectRatio(width, height)) return "aspect_ratio_out_of_range";
  return null;
}

/** Legacy clip-based promos were cut from full work (non-zero start) */
export function isLegacyClipPromo(clipStartSec?: number): boolean {
  return typeof clipStartSec === "number" && clipStartSec > 0.5;
}
