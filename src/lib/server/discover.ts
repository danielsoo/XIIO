import type { Firestore } from "firebase-admin/firestore";
import { parseUserProfileDoc } from "@/lib/userAccess";
import { getUsersActivityStatus } from "@/lib/server/user-activity";
import type { ProfileRoleTag } from "@/types/portfolio";

export type DiscoverPersonCard = {
  uid: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  headline?: string;
  bio?: string;
  roleTags: ProfileRoleTag[];
  crewRoles?: string[];
  openToCollaborate: boolean;
  collaborationNote?: string;
  followerCount: number;
  isOnline: boolean;
  lastSeenAt: string | null;
};

export async function listDiscoverablePeople(
  db: Firestore,
  opts: {
    role?: ProfileRoleTag;
    openOnly?: boolean;
    q?: string;
    followingOnly?: string[];
    limit?: number;
  }
): Promise<DiscoverPersonCard[]> {
  const limit = Math.min(opts.limit ?? 48, 60);
  const snap = await db
    .collection("users")
    .where("isDiscoverable", "==", true)
    .orderBy("updatedAt", "desc")
    .limit(120)
    .get();

  const qLower = opts.q?.trim().toLowerCase() ?? "";
  const followingSet = opts.followingOnly ? new Set(opts.followingOnly) : null;

  const cards: DiscoverPersonCard[] = [];
  for (const doc of snap.docs) {
    const profile = parseUserProfileDoc(doc.data() as Record<string, unknown>);
    const handle = profile.handle?.trim();
    if (!handle) continue;
    if (followingSet && !followingSet.has(doc.id)) continue;
    if (opts.openOnly && !profile.openToCollaborate) continue;
    if (opts.role && !profile.roleTags?.includes(opts.role)) continue;

    if (qLower) {
      const hay = [
        handle,
        profile.displayName,
        profile.headline ?? "",
        profile.bio ?? "",
        ...(profile.crewRoles ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(qLower)) continue;
    }

    cards.push({
      uid: doc.id,
      handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      headline: profile.headline,
      bio: profile.bio,
      roleTags: profile.roleTags ?? [],
      crewRoles: profile.crewRoles,
      openToCollaborate: profile.openToCollaborate === true,
      collaborationNote: profile.collaborationNote,
      followerCount: profile.followerCount ?? 0,
      isOnline: false,
      lastSeenAt: null,
    });
    if (cards.length >= limit) break;
  }

  const activityByUid = await getUsersActivityStatus(cards.map((c) => c.uid));
  return cards.map((card) => {
    const activity = activityByUid[card.uid];
    return {
      ...card,
      isOnline: activity?.isOnline === true,
      lastSeenAt: activity?.lastSeenAt ?? null,
    };
  });
}
