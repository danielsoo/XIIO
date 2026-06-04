import {
  DEFAULT_CAMPUS_BACKGROUND_ID,
  DEFAULT_HOME_BACKGROUND_ID,
  isValidCampusBackgroundId,
  isValidHomeBackgroundId,
  type CampusBackgroundId,
  type HomeBackgroundId,
} from "./homeHeroColors";

export type HeroBackgroundScope = "home" | "campus";

export type { HomeBackgroundId, CampusBackgroundId };
export type HeroBackgroundId = HomeBackgroundId | CampusBackgroundId;

export { DEFAULT_HOME_BACKGROUND_ID, DEFAULT_CAMPUS_BACKGROUND_ID };
export { isValidHomeBackgroundId, isValidCampusBackgroundId };

export type HeroTopBleed = "wave" | "brightSurface";

type HeroBackgroundPreset = {
  scope: HeroBackgroundScope;
  src: string;
  objectPosition: string;
  topBleed?: HeroTopBleed;
  /** CSS filter on blur + sharp layers (highlight rolloff) */
  photoFilter?: string;
  /** When false, skip theme HEX / vignette overlays (photo only) */
  themeOverlay?: boolean;
};

/** Campus `/school-battle` vertical anchor — home presets match this start height */
export const CAMPUS_HERO_OBJECT_POSITION = "right center";

export const HERO_BACKGROUND_PRESETS: Record<HeroBackgroundId, HeroBackgroundPreset> = {
  home_wave: {
    scope: "home",
    src: "/images/hero/home-wave.png",
    // Taller asset (643px) vs campus 576px — lower Y aligns wave crest with campus_wave1
    objectPosition: "right 38%",
    topBleed: "wave",
  },
  home_under_water: {
    scope: "home",
    src: "/images/hero/home-under-water.png",
    objectPosition: "center 22%",
    topBleed: "wave",
    themeOverlay: false,
  },
  campus_wave1: {
    scope: "campus",
    src: "/images/hero/campus-wave1.png",
    objectPosition: CAMPUS_HERO_OBJECT_POSITION,
  },
  campus_wave2: {
    scope: "campus",
    src: "/images/hero/campus-wave2.png",
    objectPosition: CAMPUS_HERO_OBJECT_POSITION,
  },
  campus_wave3: {
    scope: "campus",
    src: "/images/hero/campus-wave3.png",
    objectPosition: CAMPUS_HERO_OBJECT_POSITION,
  },
};

export const HOME_BACKGROUND_IDS = Object.entries(HERO_BACKGROUND_PRESETS)
  .filter(([, p]) => p.scope === "home")
  .map(([id]) => id as HomeBackgroundId);

export const CAMPUS_BACKGROUND_IDS = Object.entries(HERO_BACKGROUND_PRESETS)
  .filter(([, p]) => p.scope === "campus")
  .map(([id]) => id as CampusBackgroundId);

export function resolveHeroBackground(
  scope: HeroBackgroundScope,
  id: HomeBackgroundId | CampusBackgroundId
): HeroBackgroundPreset {
  const preset = HERO_BACKGROUND_PRESETS[id as HeroBackgroundId];
  if (preset && preset.scope === scope) return preset;
  const fallbackId = scope === "home" ? DEFAULT_HOME_BACKGROUND_ID : DEFAULT_CAMPUS_BACKGROUND_ID;
  return HERO_BACKGROUND_PRESETS[fallbackId];
}
