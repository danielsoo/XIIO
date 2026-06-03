import { DEFAULT_HOME_BACKGROUND_ID, type HomeBackgroundId } from "@/lib/homeHeroColors";
import { resolveHeroBackground } from "@/lib/heroBackgroundPresets";

/** @deprecated Use resolveHeroBackground("home", id) */
export const HERO_LANDSCAPE_IMAGE = resolveHeroBackground("home", DEFAULT_HOME_BACKGROUND_ID).src;
export const HERO_LANDSCAPE_POSITION = resolveHeroBackground("home", DEFAULT_HOME_BACKGROUND_ID)
  .objectPosition;

export function getHomeHeroBackground(id: HomeBackgroundId = DEFAULT_HOME_BACKGROUND_ID) {
  return resolveHeroBackground("home", id);
}
