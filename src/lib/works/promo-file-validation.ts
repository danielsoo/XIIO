import {
  validatePromoVideoDimensions,
  validatePromoVideoDuration,
} from "@/lib/works/promo-video";

export type PromoFileValidationError =
  | "loading"
  | "too_small"
  | "invalid_dimensions"
  | "too_short"
  | "too_long"
  | null;

export function getPromoFileValidationError(
  hasFile: boolean,
  meta: { width: number; height: number; duration: number } | null
): PromoFileValidationError {
  if (!hasFile) return null;
  if (!meta) return "loading";
  const dimErr = validatePromoVideoDimensions(meta.width, meta.height);
  if (dimErr) return dimErr;
  const durErr = validatePromoVideoDuration(meta.duration);
  if (durErr) return durErr;
  return null;
}
