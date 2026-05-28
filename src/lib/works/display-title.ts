/** Server/API default when no title candidates are present. */
export const FALLBACK_WORK_TITLE = "Untitled";

/** First non-empty trimmed title, otherwise `fallback`. */
export function resolveDisplayTitle(
  fallback: string,
  ...candidates: (string | null | undefined)[]
): string {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) return trimmed;
  }
  return fallback;
}
