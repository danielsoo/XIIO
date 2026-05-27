export const GUEST_PREVIEW_RATIO = 0.25;

export function guestPreviewLimitSeconds(durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0;
  return durationSec * GUEST_PREVIEW_RATIO;
}
