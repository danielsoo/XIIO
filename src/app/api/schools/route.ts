import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { getDbOrNull } from "@/lib/server/works";
import { getOrCreateSchool } from "@/lib/server/schools";

/** 업로드 시 학교 검색 결과에 없으면 자가등록 — pending 상태로 즉시 생성, 관리자가 비동기로 정리 */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  let body: { name?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식이 올바르지 않습니다.", 400);
  }

  const name = body.name?.trim();
  if (!name) return jsonError("name_required", "학교 이름이 필요합니다.", 400);

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  try {
    const school = await getOrCreateSchool(db, name, auth.session.uid);
    return NextResponse.json({ school });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "invalid_school_name") {
      return jsonError("invalid_school_name", "유효한 학교 이름이 아닙니다.", 400);
    }
    throw e;
  }
}
