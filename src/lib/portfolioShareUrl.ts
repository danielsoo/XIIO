/**
 * API may return an absolute URL (NEXT_PUBLIC_APP_URL) or a path (/p/...).
 * Clipboard and in-app links must not prepend origin twice.
 */
export function normalizePortfolioShareUrl(
  shareUrl: string,
  origin?: string
): string {
  const trimmed = shareUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (origin) {
    return `${origin.replace(/\/$/, "")}${path}`;
  }
  return path;
}

/** Path-only portfolio URL for list rows (token → /p/{token}). */
export function portfolioSharePath(token: string): string {
  return `/p/${token}`;
}
