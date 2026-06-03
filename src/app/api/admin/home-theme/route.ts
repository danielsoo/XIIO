import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { getAdminDb } from "@/lib/server/firebase-admin";
import {
  DEFAULT_HOME_HERO_THEME,
  isValidCampusBackgroundId,
  isValidHomeBackgroundId,
  parseFirestoreHomeTheme,
  themeFromHeroHex,
} from "@/lib/homeHeroColors";

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return auth.error;
  }

  const db = getAdminDb();
  if (!db) {
    return jsonError("admin_not_configured", "서버 Firebase Admin이 설정되지 않았습니다.", 503);
  }

  let body: {
    heroHex?: string;
    overlayEnabled?: boolean;
    homeBackgroundId?: string;
    campusBackgroundId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_body", "요청 본문이 올바르지 않습니다.", 400);
  }

  const ref = db.collection("config").doc("homeTheme");
  const existingSnap = await ref.get();
  const existing =
    parseFirestoreHomeTheme(existingSnap.data() as Record<string, unknown>) ??
    DEFAULT_HOME_HERO_THEME;

  const heroHex =
    typeof body.heroHex === "string" && body.heroHex.trim()
      ? body.heroHex
      : existing.heroHex;
  const overlayEnabled =
    typeof body.overlayEnabled === "boolean" ? body.overlayEnabled : existing.overlayEnabled;
  const homeBackgroundId =
    typeof body.homeBackgroundId === "string" && isValidHomeBackgroundId(body.homeBackgroundId)
      ? body.homeBackgroundId
      : existing.homeBackgroundId;
  const campusBackgroundId =
    typeof body.campusBackgroundId === "string" &&
    isValidCampusBackgroundId(body.campusBackgroundId)
      ? body.campusBackgroundId
      : existing.campusBackgroundId;
  const theme = themeFromHeroHex(heroHex, overlayEnabled, {
    homeBackgroundId,
    campusBackgroundId,
  });
  if (!theme) {
    return jsonError("invalid_hex", "올바른 HEX 색상(#RRGGBB)을 입력해 주세요.", 400);
  }

  await ref.set({
    heroHex: theme.heroHex,
    ctaHex: theme.ctaHex,
    ctaHoverHex: theme.ctaHoverHex,
    overlayEnabled: theme.overlayEnabled,
    homeBackgroundId: theme.homeBackgroundId,
    campusBackgroundId: theme.campusBackgroundId,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: auth.session.uid,
  });

  const snap = await ref.get();
  const updatedAt = snap.data()?.updatedAt;
  const updatedAtIso =
    updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : null;

  return NextResponse.json({
    ok: true,
    theme: {
      heroHex: theme.heroHex,
      ctaHex: theme.ctaHex,
      ctaHoverHex: theme.ctaHoverHex,
      overlayEnabled: theme.overlayEnabled,
      homeBackgroundId: theme.homeBackgroundId,
      campusBackgroundId: theme.campusBackgroundId,
      updatedAt: updatedAtIso,
    },
  });
}
