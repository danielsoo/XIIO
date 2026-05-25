import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { listDiscoverablePeople } from "@/lib/server/discover";
import { listFollowingUids } from "@/lib/server/follows";
import { isProfileRoleTag } from "@/lib/roleTags";
import { getDbOrNull } from "@/lib/server/works";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

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
    followingUids = await listFollowingUids(db, auth.session.uid);
    if (followingUids.length === 0) {
      return NextResponse.json({ people: [] });
    }
  }

  const people = await listDiscoverablePeople(db, {
    role,
    openOnly,
    q,
    followingOnly: followingUids,
    limit: 48,
  });

  return NextResponse.json({ people });
}
