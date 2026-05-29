import {
  validatePrologueVideoDimensions,
  validatePrologueVideoDuration,
  type PrologueVideoDimensionError,
  type PrologueVideoDurationError,
} from "@/lib/works/prologue-video";

export type PrologueFileValidationError =
  | PrologueVideoDimensionError
  | PrologueVideoDurationError
  | "loading"
  | null;

export function getPrologueFileValidationError(
  hasFile: boolean,
  meta: { width: number; height: number; duration: number } | null
): PrologueFileValidationError {
  if (!hasFile) return null;
  if (!meta) return "loading";
  const dimErr = validatePrologueVideoDimensions(meta.width, meta.height);
  if (dimErr) return dimErr;
  const durErr = validatePrologueVideoDuration(meta.duration);
  if (durErr) return durErr;
  return null;
}
