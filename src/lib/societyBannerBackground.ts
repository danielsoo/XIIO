import {
  HERO_BACKGROUND_PRESETS,
  type HeroBackgroundId,
} from "@/lib/heroBackgroundPresets";

export const DEFAULT_SOCIETY_BANNER_ID: HeroBackgroundId = "home_wave";

export const SOCIETY_BANNER_IDS: HeroBackgroundId[] = [
  "home_wave",
  "home_under_water",
  "campus_wave1",
  "campus_wave2",
  "campus_wave3",
];

export function parseSocietyBannerBackgroundId(raw: unknown): HeroBackgroundId | undefined {
  if (typeof raw !== "string") return undefined;
  const id = raw.trim() as HeroBackgroundId;
  return SOCIETY_BANNER_IDS.includes(id) ? id : undefined;
}

export function resolveSocietyBannerBackground(id?: HeroBackgroundId | null) {
  const resolved = id && HERO_BACKGROUND_PRESETS[id] ? id : DEFAULT_SOCIETY_BANNER_ID;
  return HERO_BACKGROUND_PRESETS[resolved];
}
