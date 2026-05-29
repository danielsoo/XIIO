import { NextResponse } from "next/server";
import { isStreamConfigured } from "@/lib/cloudflare/stream";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { beginFullStreamUpload } from "@/lib/server/staging-stream-upload";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ workId: string }> };

/** 심사 제출 시 본편 Stream TUS URL 발급 */
export async function POST(request: Request, { params }: Params) {
  if (!isStreamConfigured()) {
    return jsonError("stream_not_configured", "Cloudflare Stream이 설정되지 않았습니다.", 503);
  }

  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  try {
    const result = await beginFullStreamUpload(db, session.uid, workId);
    return NextResponse.json({ workId, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "not_found") return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);
    if (msg === "invalid_state") return jsonError("invalid_state", "제출할 수 없는 상태입니다.", 400);
    if (msg === "staging_incomplete" || msg === "staging_bytes_missing") {
      return jsonError("staging_incomplete", "스테이징된 영상이 없습니다.", 400);
    }
    return jsonError("stream_api_failed", msg, 502);
  }
}
