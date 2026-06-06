import {
  DEFAULT_HOME_HERO_THEME,
  parseFirestoreHomeTheme,
  type HomeHeroTheme,
} from "@/lib/homeHeroColors";
import { getAdminDb } from "@/lib/server/firebase-admin";

/** Server-side home hero theme for layout seed (avoids DEFAULT flash on refresh). */
export async function getServerHomeTheme(): Promise<HomeHeroTheme> {
  const db = getAdminDb();
  if (!db) return DEFAULT_HOME_HERO_THEME;

  try {
    const snap = await db.collection("config").doc("homeTheme").get();
    if (!snap.exists) return DEFAULT_HOME_HERO_THEME;
    const parsed = parseFirestoreHomeTheme(snap.data() as Record<string, unknown>);
    return parsed ?? DEFAULT_HOME_HERO_THEME;
  } catch {
    return DEFAULT_HOME_HERO_THEME;
  }
}
