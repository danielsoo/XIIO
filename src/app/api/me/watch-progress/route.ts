import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { listWatchProgress, setWatchProgress } from "@/lib/server/watch-progress";
import { getDbOrNull } from "@/lib/server/works";

type WatchProgressBody = {
  ownerUid: string;
  workId: string;
  positionSec: number;
  durationSec: number;
};

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const items = await listWatchProgress(db, auth.session.uid);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: WatchProgressBody;
  try {
    body = (await request.json()) as WatchProgressBody;
  } catch {
    return jsonError("invalid_body", "요청 형식이 올바르지 않습니다.", 400);
  }

  const { ownerUid, workId, positionSec, durationSec } = body;
  if (
    !ownerUid ||
    !workId ||
    typeof positionSec !== "number" ||
    !Number.isFinite(positionSec) ||
    typeof durationSec !== "number" ||
    !Number.isFinite(durationSec)
  ) {
    return jsonError("invalid_body", "ownerUid, workId, positionSec, durationSec가 필요합니다.", 400);
  }

  const result = await setWatchProgress(db, auth.session.uid, ownerUid, workId, positionSec, durationSec);
  if (!result.ok) {
    if (result.error === "not_found") {
      return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);
    }
    return jsonError("not_published", "공개된 작품이 아닙니다.", 404);
  }

  return NextResponse.json({ ok: true });
}
