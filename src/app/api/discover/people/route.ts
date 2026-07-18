import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import {
  listDiscoverablePeople,
  type DiscoverPersonCard,
} from "@/lib/server/discover";
import { listFollowingUids } from "@/lib/server/follows";
import { isProfileRoleTag } from "@/lib/roleTags";
import { getDbOrNull } from "@/lib/server/works";
import type { Firestore } from "firebase-admin/firestore";

const PUBLIC_CACHE_MS = 60 * 1000;
const publicCache = new Map<string, { expiresAt: number; people: DiscoverPersonCard[] }>();
const publicInFlight = new Map<string, Promise<DiscoverPersonCard[]>>();

async function loadPublicPeople(
  db: Firestore,
  options: { role?: Parameters<typeof listDiscoverablePeople>[1]["role"]; openOnly: boolean; q: string }
) {
  const key = `${options.role ?? "all"}:${options.openOnly ? "open" : "all"}:${options.q
    .trim()
    .toLowerCase()}`;
  const cached = publicCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.people;

  const active = publicInFlight.get(key);
  if (active) return active;

  const promise = listDiscoverablePeople(db, {
    ...options,
    limit: 48,
    includeActivity: false,
  })
    .then((people) => {
      if (publicCache.size >= 32) publicCache.delete(publicCache.keys().next().value ?? "");
      publicCache.set(key, { expiresAt: Date.now() + PUBLIC_CACHE_MS, people });
      return people;
    })
    .finally(() => publicInFlight.delete(key));
  publicInFlight.set(key, promise);
  return promise;
}

export async function GET(request: Request) {
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const url = new URL(request.url);
  const roleRaw = url.searchParams.get("role") ?? "";
  const role = isProfileRoleTag(roleRaw) ? roleRaw : undefined;
  const openOnly = url.searchParams.get("openOnly") === "1";
  const followingOnly = url.searchParams.get("followingOnly") === "1";
  const q = url.searchParams.get("q") ?? "";

  let followingUids: string[] | undefined;
  if (followingOnly) {
    const auth = await requireUser(request);
    if ("error" in auth) return auth.error;
    followingUids = await listFollowingUids(db, auth.session.uid);
    if (followingUids.length === 0) {
      return NextResponse.json({ people: [] });
    }
  }

  const people = followingOnly
    ? await listDiscoverablePeople(db, {
        role,
        openOnly,
        q,
        followingOnly: followingUids,
        limit: 48,
        includeActivity: false,
      })
    : await loadPublicPeople(db, { role, openOnly, q });

  return NextResponse.json(
    { people },
    {
      headers: followingOnly
        ? { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" }
        : { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    }
  );
}
