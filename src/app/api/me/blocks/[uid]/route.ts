import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { blockUser, unblockUser } from "@/lib/server/blocks";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ uid: string }> };

export async function POST(_request: Request, { params }: Params) {
  const auth = await requireUser(_request);
  if ("error" in auth) return auth.error;

  const { uid: blockedUid } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  await blockUser(db, auth.session.uid, blockedUid);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireUser(_request);
  if ("error" in auth) return auth.error;

  const { uid: blockedUid } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  await unblockUser(db, auth.session.uid, blockedUid);
  return NextResponse.json({ ok: true });
}
