export const PROLOGUE_MIN_DURATION_SEC = 3;
export const PROLOGUE_MAX_DURATION_SEC = 600;

export type PrologueVideoDurationError = "invalid_duration" | "too_short" | "too_long";
export type PrologueVideoDimensionError = "invalid_dimensions" | "too_small";

export const PROLOGUE_MIN_DIMENSION_PX = 360;

export function validatePrologueVideoDuration(sec: number): PrologueVideoDurationError | null {
  if (!Number.isFinite(sec) || sec <= 0) return "invalid_duration";
  if (sec < PROLOGUE_MIN_DURATION_SEC) return "too_short";
  if (sec > PROLOGUE_MAX_DURATION_SEC) return "too_long";
  return null;
}

export function validatePrologueVideoDimensions(
  width: number,
  height: number
): PrologueVideoDimensionError | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return "invalid_dimensions";
  }
  if (Math.min(width, height) < PROLOGUE_MIN_DIMENSION_PX) return "too_small";
  return null;
}
