import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { getUsersActivityStatus } from "@/lib/server/user-activity";
import { getDbOrNull } from "@/lib/server/works";
import { isAccountDeleted, parseUserProfileDoc } from "@/lib/userAccess";

const MAX_UIDS = 60;

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: { uids?: unknown };
  try {
    body = (await request.json()) as { uids?: unknown };
  } catch {
    return jsonError("invalid_body", "요청 본문이 올바르지 않습니다.", 400);
  }

  const raw = Array.isArray(body.uids) ? body.uids : [];
  const uids = [
    ...new Set(
      raw
        .filter((u): u is string => typeof u === "string")
        .map((u) => u.trim())
        .filter(Boolean)
    ),
  ].slice(0, MAX_UIDS);

  if (uids.length === 0) {
    return NextResponse.json({ presence: {} });
  }

  const snaps = await Promise.all(uids.map((uid) => db.collection("users").doc(uid).get()));
  const allowed: string[] = [];
  for (let i = 0; i < uids.length; i++) {
    const snap = snaps[i];
    if (!snap.exists) continue;
    const profile = parseUserProfileDoc(snap.data() as Record<string, unknown>);
    if (isAccountDeleted(profile)) continue;
    if (profile.isDiscoverable === false) continue;
    allowed.push(uids[i]);
  }

  const presence = await getUsersActivityStatus(allowed);
  return NextResponse.json({ presence });
}
