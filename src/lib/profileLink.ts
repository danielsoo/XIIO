/** Parse stored profile link — https (or http) URL, max 2048 chars */
export function parseProfileLink(raw: unknown): string | undefined {
  if (raw == null || raw === "") return undefined;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const href =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
  try {
    const u = new URL(href);
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    return u.toString().slice(0, 2048);
  } catch {
    return undefined;
  }
}

export function isValidProfileLinkInput(input: string): boolean {
  if (!input.trim()) return true;
  return parseProfileLink(input) !== undefined;
}

/** Display like mockup: linktr.ee/oceandrift */
export function displayProfileLink(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname;
    return `${u.host}${path}`.replace(/\/$/, "");
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}
