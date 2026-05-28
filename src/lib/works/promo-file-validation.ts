import {
  validatePromoVideoDimensions,
  validatePromoVideoDuration,
  type PromoVideoAspectError,
  type PromoVideoDurationError,
} from "@/lib/works/promo-video";

export type { PromoVideoAspectError, PromoVideoDurationError };

export type PromoFileValidationError =
  | PromoVideoAspectError
  | PromoVideoDurationError
  | "loading"
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
