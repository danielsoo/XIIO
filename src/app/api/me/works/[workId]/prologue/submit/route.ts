import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { FieldValue, getDbOrNull, parsePrologueDoc, prologueRef } from "@/lib/server/works";

type Params = { params: Promise<{ workId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const ref = prologueRef(db, session.uid, workId);
  const snap = await ref.get();
  if (!snap.exists) {
    return jsonError("not_found", "먼저 프롤로그를 저장하세요.", 404);
  }

  const prologue = parsePrologueDoc(snap.data() as Record<string, unknown>);

  if (prologue.platformStatus === "published") {
    const rev = prologue.pendingRevision;
    if (!rev || (rev.platformStatus !== "draft" && rev.platformStatus !== "rejected")) {
      return jsonError("invalid_state", "제출할 수정본이 없습니다.", 400);
    }
    if (rev.streamStatus !== "ready") {
      return jsonError("not_ready", "인코딩이 끝난 후 제출할 수 있습니다.", 400);
    }
    const { rejectReason: _ignored, ...revRest } = rev;
    await ref.update({
      pendingRevision: {
        ...revRest,
        platformStatus: "pending",
        submittedAt: FieldValue.serverTimestamp(),
      },
      revisionReviewStatus: "pending",
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, revisionMode: true, revisionReviewStatus: "pending" });
  }

  if (prologue.platformStatus !== "draft" && prologue.platformStatus !== "rejected") {
    return jsonError("invalid_state", "제출할 수 없는 상태입니다.", 400);
  }
  if (prologue.streamStatus !== "ready") {
    return jsonError("not_ready", "인코딩이 끝난 후 제출할 수 있습니다.", 400);
  }

  await ref.update({
    platformStatus: "pending",
    submittedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    rejectReason: FieldValue.delete(),
  });

  return NextResponse.json({ ok: true, platformStatus: "pending" });
}
