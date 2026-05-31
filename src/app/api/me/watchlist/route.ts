import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import {
  isInWatchlist,
  listWatchlistItems,
  setWatchlistItem,
} from "@/lib/server/watchlist";
import { getDbOrNull } from "@/lib/server/works";

type WatchlistBody = {
  ownerUid: string;
  workId: string;
  saved: boolean;
};

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const { searchParams } = new URL(request.url);
  const ownerUid = searchParams.get("ownerUid");
  const workId = searchParams.get("workId");

  if (ownerUid && workId) {
    const saved = await isInWatchlist(db, auth.session.uid, ownerUid, workId);
    return NextResponse.json({ saved });
  }

  const items = await listWatchlistItems(db, auth.session.uid);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: WatchlistBody;
  try {
    body = (await request.json()) as WatchlistBody;
  } catch {
    return jsonError("invalid_body", "요청 형식이 올바르지 않습니다.", 400);
  }

  const { ownerUid, workId, saved } = body;
  if (!ownerUid || !workId || typeof saved !== "boolean") {
    return jsonError("invalid_body", "ownerUid, workId, saved가 필요합니다.", 400);
  }

  const result = await setWatchlistItem(db, auth.session.uid, ownerUid, workId, saved);
  if (!result.ok) {
    if (result.error === "not_found") {
      return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);
    }
    return jsonError("not_published", "공개된 작품이 아닙니다.", 404);
  }

  return NextResponse.json({ ok: true, saved: result.saved });
}
