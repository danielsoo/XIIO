import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";
import {
  DEFAULT_HOME_HERO_THEME,
  parseFirestoreHomeTheme,
} from "@/lib/homeHeroColors";

export async function GET() {
  const db = getAdminDb();
  const fallback = {
    heroHex: DEFAULT_HOME_HERO_THEME.heroHex,
    ctaHex: DEFAULT_HOME_HERO_THEME.ctaHex,
    ctaHoverHex: DEFAULT_HOME_HERO_THEME.ctaHoverHex,
    overlayEnabled: DEFAULT_HOME_HERO_THEME.overlayEnabled,
    homeBackgroundId: DEFAULT_HOME_HERO_THEME.homeBackgroundId,
    campusBackgroundId: DEFAULT_HOME_HERO_THEME.campusBackgroundId,
    updatedAt: null as string | null,
  };

  if (!db) {
    return NextResponse.json(fallback, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  }

  const snap = await db.collection("config").doc("homeTheme").get();
  const theme = snap.exists
    ? parseFirestoreHomeTheme(snap.data() as Record<string, unknown>)
    : null;

  const updatedAt = snap.data()?.updatedAt;
  const updatedAtIso =
    updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : null;

  return NextResponse.json(
    theme
      ? {
          heroHex: theme.heroHex,
          ctaHex: theme.ctaHex,
          ctaHoverHex: theme.ctaHoverHex,
          overlayEnabled: theme.overlayEnabled,
          homeBackgroundId: theme.homeBackgroundId,
          campusBackgroundId: theme.campusBackgroundId,
          updatedAt: updatedAtIso,
        }
      : fallback,
    {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    }
  );
}
