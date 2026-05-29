import type { SubmitProgressPhase } from "@/lib/works/submit-for-review";

export type UploadPhase =
  | "creating"
  | "thumbnail"
  | "full"
  | "promo"
  | "finalizing"
  | "streamFull"
  | "streamPromo"
  | "encoding";

/** Inclusive segment ends for overall submit flow (0–100). */
export const UPLOAD_PROGRESS = {
  creatingEnd: 5,
  thumbnailEnd: 10,
  fullEnd: 22,
  promoEnd: 35,
  stagingEnd: 40,
  streamFullEnd: 65,
  streamPromoEnd: 85,
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

/** Map staging phase + optional byte ratio (0–1) to 0–40%. */
export function uploadPercentForPhase(phase: UploadPhase, byteRatio = 0): number {
  const r = Math.min(1, Math.max(0, byteRatio));
  switch (phase) {
    case "creating":
      return UPLOAD_PROGRESS.creatingEnd;
    case "thumbnail":
      return UPLOAD_PROGRESS.thumbnailEnd;
    case "full":
      return Math.round(
        UPLOAD_PROGRESS.thumbnailEnd + r * (UPLOAD_PROGRESS.fullEnd - UPLOAD_PROGRESS.thumbnailEnd)
      );
    case "promo":
      return Math.round(
        UPLOAD_PROGRESS.fullEnd + r * (UPLOAD_PROGRESS.promoEnd - UPLOAD_PROGRESS.fullEnd)
      );
    case "finalizing":
      return UPLOAD_PROGRESS.stagingEnd;
    case "streamFull":
    case "streamPromo":
    case "encoding":
      return uploadPercentForSubmitPhase(phase, byteRatio);
    default:
      return 0;
  }
}

/** Stream upload + encoding (after staging) mapped to 40–100%. */
export function uploadPercentForSubmitPhase(
  phase: SubmitProgressPhase | "streamFull" | "streamPromo" | "encoding",
  byteRatio = 0
): number {
  const r = Math.min(1, Math.max(0, byteRatio));
  switch (phase) {
    case "full_upload":
    case "streamFull":
      return Math.round(
        UPLOAD_PROGRESS.stagingEnd +
          r * (UPLOAD_PROGRESS.streamFullEnd - UPLOAD_PROGRESS.stagingEnd)
      );
    case "promo_upload":
    case "streamPromo":
      return Math.round(
        UPLOAD_PROGRESS.streamFullEnd +
          r * (UPLOAD_PROGRESS.streamPromoEnd - UPLOAD_PROGRESS.streamFullEnd)
      );
    case "encoding":
    case "done":
      return Math.round(
        UPLOAD_PROGRESS.streamPromoEnd +
          r * (UPLOAD_PROGRESS.complete - UPLOAD_PROGRESS.streamPromoEnd)
      );
    default:
      return UPLOAD_PROGRESS.stagingEnd;
  }
}

export function applySubmitProgress(
  submit: { phase: SubmitProgressPhase; percent: number },
  setPhase: (p: UploadPhase) => void,
  setPercent: (n: number) => void
): void {
  const phaseMap: Record<SubmitProgressPhase, UploadPhase> = {
    full_upload: "streamFull",
    promo_upload: "streamPromo",
    encoding: "encoding",
    done: "encoding",
  };
  const uiPhase = phaseMap[submit.phase];
  setPhase(uiPhase);
  const ratio = submit.phase === "encoding" || submit.phase === "done" ? submit.percent / 100 : submit.percent / 100;
  setPercent(uploadPercentForSubmitPhase(submit.phase, ratio));
}
