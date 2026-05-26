export function peopleProfileHref(handle: string | null | undefined): string | null {
  const h = handle?.trim();
  return h ? `/people/${encodeURIComponent(h)}` : null;
}
