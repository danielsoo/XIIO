import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { parseAnalyticsSummary } from "@/lib/server/engagement";
import { getDbOrNull, worksCol } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";
import {
  DEFAULT_SOCIETY_BANNER_ID,
  parseSocietyBannerBackgroundId,
} from "@/lib/societyBannerBackground";

const CACHE_TTL_MS = 60_000;
const responseCache = new Map<string, { expiresAt: number; data: SocietySummaryResponse }>();
const inFlight = new Map<string, Promise<SocietySummaryResponse>>();

type SocietySummaryResponse = {
  displayName: string;
  handle: string | null;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  schoolName: string | null;
  profileLink: string | null;
  societyBannerBackgroundId: string;
  stories: number;
  followers: number;
  following: number;
  totalViews: number;
};

async function loadSummary(uid: string): Promise<SocietySummaryResponse> {
  const db = await getDbOrNull();
  if (!db) throw new Error("admin_not_configured");

  const userRef = db.collection("users").doc(uid);
  const analyticsRef = userRef.collection("private").doc("analytics");
  const [profileSnap, storiesSnap, analyticsSnap] = await Promise.all([
    userRef.get(),
    worksCol(db, uid).where("platformStatus", "==", "published").count().get(),
    analyticsRef.get(),
  ]);

  if (!profileSnap.exists) throw new Error("profile_not_found");
  const profile = parseUserProfileDoc(profileSnap.data() as Record<string, unknown>);
  const analytics = parseAnalyticsSummary(
    analyticsSnap.data() as Record<string, unknown> | undefined
  );

  return {
    displayName: profile.displayName?.trim() || "—",
    handle: profile.handle?.trim() || null,
    headline: profile.headline?.trim() || null,
    bio: profile.bio?.trim() || null,
    avatarUrl: profile.avatarUrl ?? null,
    schoolName: profile.schoolName?.trim() || null,
    profileLink: profile.profileLink ?? null,
    societyBannerBackgroundId:
      parseSocietyBannerBackgroundId(profile.societyBannerBackgroundId) ??
      DEFAULT_SOCIETY_BANNER_ID,
    stories: storiesSnap.data().count,
    followers: profile.followerCount ?? 0,
    following: profile.followingCount ?? 0,
    totalViews: analytics.totalViews ?? 0,
  };
}

async function getSummary(uid: string): Promise<SocietySummaryResponse> {
  const cached = responseCache.get(uid);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  if (cached) responseCache.delete(uid);

  const active = inFlight.get(uid);
  if (active) return active;

  const promise = loadSummary(uid)
    .then((data) => {
      responseCache.set(uid, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    })
    .finally(() => inFlight.delete(uid));
  inFlight.set(uid, promise);
  return promise;
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  try {
    const data = await getSummary(auth.session.uid);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        Vary: "Authorization",
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "summary_unavailable";
    if (code === "admin_not_configured") {
      return jsonError(code, "서버 DB를 사용할 수 없습니다.", 503);
    }
    if (code === "profile_not_found") {
      return jsonError(code, "프로필이 없습니다.", 404);
    }
    return jsonError("summary_unavailable", "프로필 요약을 불러오지 못했습니다.", 500);
  }
}
