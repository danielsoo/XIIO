export function peopleProfileHref(
  handle: string | null | undefined,
  uid?: string | null | undefined
): string | null {
  const h = handle?.trim();
  if (h) return `/people/${encodeURIComponent(h)}`;
  const u = uid?.trim();
  if (u) return `/people/u/${encodeURIComponent(u)}`;
  return null;
}
