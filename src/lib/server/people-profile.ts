import type { Firestore } from "firebase-admin/firestore";
import { getUploaderAnalytics } from "@/lib/server/engagement";
import { getUsersActivityStatus } from "@/lib/server/user-activity";
import {
  DEFAULT_SOCIETY_BANNER_ID,
  parseSocietyBannerBackgroundId,
} from "@/lib/societyBannerBackground";
import type { HeroBackgroundId } from "@/lib/heroBackgroundPresets";
import { parseWorkDoc, worksCol } from "@/lib/server/works";
import type { UserProfileDoc } from "@/types/user";

export type PeopleProfileHeroMeta = {
  schoolName: string | null;
  societyBannerBackgroundId: HeroBackgroundId;
  stats: { stories: number; totalViews: number };
  isOnline: boolean;
  lastSeenAt: string | null;
};

export async function getPeopleProfileHeroMeta(
  db: Firestore,
  uid: string,
  profile: UserProfileDoc
): Promise<PeopleProfileHeroMeta> {
  const worksSnap = await worksCol(db, uid).get();
  let stories = 0;
  for (const doc of worksSnap.docs) {
    const work = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
    if (work.platformStatus === "published") stories += 1;
  }

  const analytics = await getUploaderAnalytics(db, uid, 90);
  const activity = await getUsersActivityStatus([uid]);
  const userActivity = activity[uid];

  const bannerId =
    parseSocietyBannerBackgroundId(profile.societyBannerBackgroundId) ?? DEFAULT_SOCIETY_BANNER_ID;

  return {
    schoolName: profile.schoolName?.trim() || null,
    societyBannerBackgroundId: bannerId,
    stats: {
      stories,
      totalViews: analytics.summary.totalViews ?? 0,
    },
    isOnline: userActivity?.isOnline === true,
    lastSeenAt: userActivity?.lastSeenAt ?? null,
  };
}
