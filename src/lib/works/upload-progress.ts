export type UploadPhase = "creating" | "thumbnail" | "full" | "promo" | "finalizing";

/** Inclusive segment ends for overall upload percent (0–100). */
export const UPLOAD_PROGRESS = {
  creatingStart: 0,
  creatingEnd: 5,
  thumbnailEnd: 10,
  fullEnd: 55,
  promoEnd: 95,
  complete: 100,
} as const;

/** Thumbnail upload byte progress between creatingEnd and thumbnailEnd. */
export function uploadPercentForThumbnail(byteRatio: number): number {
  const r = Math.min(1, Math.max(0, byteRatio));
  return Math.round(
    UPLOAD_PROGRESS.creatingEnd +
      r * (UPLOAD_PROGRESS.thumbnailEnd - UPLOAD_PROGRESS.creatingEnd)
  );
}

/** Map phase + optional byte ratio (0–1) within full/promo to 0–100 percent. */
export function uploadPercentForPhase(phase: UploadPhase, byteRatio = 0): number {
  const r = Math.min(1, Math.max(0, byteRatio));
  switch (phase) {
    case "creating":
      return UPLOAD_PROGRESS.creatingEnd;
    case "thumbnail":
      return UPLOAD_PROGRESS.thumbnailEnd;
    case "full":
      return Math.round(
        UPLOAD_PROGRESS.thumbnailEnd +
          r * (UPLOAD_PROGRESS.fullEnd - UPLOAD_PROGRESS.thumbnailEnd)
      );
    case "promo":
      return Math.round(
        UPLOAD_PROGRESS.fullEnd + r * (UPLOAD_PROGRESS.promoEnd - UPLOAD_PROGRESS.fullEnd)
      );
    case "finalizing":
      return UPLOAD_PROGRESS.complete;
    default:
      return 0;
  }
}
