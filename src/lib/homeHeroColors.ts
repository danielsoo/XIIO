export type RgbTuple = readonly [number, number, number];

export type HomeHeroTheme = {
  heroHex: string;
  ctaHex: string;
  ctaHoverHex: string;
  overlayEnabled: boolean;
};

const HEX6 = /^#?([0-9a-fA-F]{6})$/;
const HEX3 = /^#?([0-9a-fA-F]{3})$/;

export const DEFAULT_HOME_HERO_THEME: HomeHeroTheme = {
  heroHex: "#1C4574",
  ctaHex: "#256195",
  ctaHoverHex: "#2d6fa8",
  overlayEnabled: true,
};

export const HOME_HERO_PREVIEW_STORAGE_KEY = "xiio-home-hero-theme-preview";

export function normalizeHex(hex: string): string | null {
  const trimmed = hex.trim();
  const six = trimmed.match(HEX6);
  if (six) {
    return `#${six[1].toUpperCase()}`;
  }
  const three = trimmed.match(HEX3);
  if (three) {
    const [r, g, b] = three[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return null;
}

export function parseHexColor(hex: string): RgbTuple | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const raw = normalized.slice(1);
  return [
    parseInt(raw.slice(0, 2), 16),
    parseInt(raw.slice(2, 4), 16),
    parseInt(raw.slice(4, 6), 16),
  ] as RgbTuple;
}

export function rgbTupleToCssVar(tuple: RgbTuple): string {
  return `${tuple[0]}, ${tuple[1]}, ${tuple[2]}`;
}

export function rgbTupleToHex(tuple: RgbTuple): string {
  const toByte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[toByte(tuple[0]), toByte(tuple[1]), toByte(tuple[2])]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): RgbTuple {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ] as RgbTuple;
}

/** CTA: hero보다 채도·명도 소폭 상승 (기존 #1C4574 → #256195 관계) */
export function deriveCtaColors(heroHex: string): Pick<HomeHeroTheme, "ctaHex" | "ctaHoverHex"> {
  const tuple = parseHexColor(heroHex);
  if (!tuple) {
    return { ctaHex: DEFAULT_HOME_HERO_THEME.ctaHex, ctaHoverHex: DEFAULT_HOME_HERO_THEME.ctaHoverHex };
  }
  const [h, s, l] = rgbToHsl(...tuple);
  const cta = hslToRgb(h, Math.min(100, s + 8), Math.min(92, l + 14));
  const ctaHover = hslToRgb(h, Math.min(100, s + 10), Math.min(95, l + 22));
  return { ctaHex: rgbTupleToHex(cta), ctaHoverHex: rgbTupleToHex(ctaHover) };
}

export function themeFromHeroHex(
  heroHex: string,
  overlayEnabled = DEFAULT_HOME_HERO_THEME.overlayEnabled
): HomeHeroTheme | null {
  const normalized = normalizeHex(heroHex);
  if (!normalized) return null;
  const derived = deriveCtaColors(normalized);
  return { heroHex: normalized, ...derived, overlayEnabled };
}

function parseOverlayEnabled(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  return DEFAULT_HOME_HERO_THEME.overlayEnabled;
}

export function hexToRgbTuple(hex: string): RgbTuple | null {
  return parseHexColor(hex);
}

export function formatRgb(tuple: RgbTuple): string {
  return `${tuple[0]}, ${tuple[1]}, ${tuple[2]}`;
}

export function formatHsl(hex: string): string {
  const tuple = parseHexColor(hex);
  if (!tuple) return "—";
  const [h, s, l] = rgbToHsl(...tuple);
  return `${Math.round(h)}°, ${Math.round(s)}%, ${Math.round(l)}%`;
}

export function formatHsv(hex: string): string {
  const tuple = parseHexColor(hex);
  if (!tuple) return "—";
  const [r, g, b] = tuple;
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d === 0) return `0°, 0%, ${Math.round(max * 100)}%`;
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return `${Math.round(h * 360)}°, ${Math.round((d / max) * 100)}%, ${Math.round(max * 100)}%`;
}

export type HsvColor = { h: number; s: number; v: number };

export function hexToHsv(hex: string): HsvColor | null {
  const tuple = parseHexColor(hex);
  if (!tuple) return null;
  const [r, g, b] = tuple;
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, v: max * 100 };
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s: (d / max) * 100, v: max * 100 };
}

export function hsvToHex({ h, s, v }: HsvColor): string {
  const sn = s / 100;
  const vn = v / 100;
  const c = vn * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vn - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return rgbTupleToHex([
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ] as RgbTuple);
}

export function parseStoredPreview(raw: string): HomeHeroTheme | null {
  try {
    const data = JSON.parse(raw) as { heroHex?: string; overlayEnabled?: boolean };
    if (!data.heroHex) return null;
    const theme = themeFromHeroHex(data.heroHex, parseOverlayEnabled(data.overlayEnabled));
    return theme;
  } catch {
    return null;
  }
}

export function parseFirestoreHomeTheme(
  data: Record<string, unknown> | undefined
): HomeHeroTheme | null {
  if (!data?.heroHex) return null;
  const hero = themeFromHeroHex(
    String(data.heroHex),
    parseOverlayEnabled(data.overlayEnabled)
  );
  if (!hero) return null;
  const cta = normalizeHex(String(data.ctaHex ?? ""));
  const ctaHover = normalizeHex(String(data.ctaHoverHex ?? ""));
  if (cta && ctaHover) {
    return {
      heroHex: hero.heroHex,
      ctaHex: cta,
      ctaHoverHex: ctaHover,
      overlayEnabled: hero.overlayEnabled,
    };
  }
  return hero;
}
