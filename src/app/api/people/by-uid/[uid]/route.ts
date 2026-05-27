import { NextResponse } from "next/server";
import { getDbOrNull } from "@/lib/server/works";
import { isAccountDeleted, parseUserProfileDoc } from "@/lib/userAccess";

type Params = { params: Promise<{ uid: string }> };

/** DM 등에서 handle 없을 때 프로필 URL 해석용 */
export async function GET(_request: Request, { params }: Params) {
  const { uid } = await params;
  const db = await getDbOrNull();
  if (!db) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const profile = parseUserProfileDoc(snap.data() as Record<string, unknown>);
  if (isAccountDeleted(profile)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const handle = profile.handle?.trim().toLowerCase();
  if (!handle) {
    return NextResponse.json({ error: "no_handle", uid }, { status: 404 });
  }

  return NextResponse.json({ uid, handle });
}
