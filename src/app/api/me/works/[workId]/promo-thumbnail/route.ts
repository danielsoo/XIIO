import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import {
  FieldValue,
  getDbOrNull,
  parseWorkDoc,
  promoRef,
  worksCol,
} from "@/lib/server/works";

type Params = { params: Promise<{ workId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  let body: { thumbnailUrl?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식이 올바르지 않습니다.", 400);
  }

  const thumbnailUrl = body.thumbnailUrl?.trim();
  if (!thumbnailUrl || !thumbnailUrl.startsWith("https://")) {
    return jsonError("invalid_thumbnail", "유효한 썸네일 URL이 필요합니다.", 400);
  }

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const workRef = worksCol(db, session.uid).doc(workId);
  const workSnap = await workRef.get();
  if (!workSnap.exists) {
    return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);
  }

  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  const promoDocRef = promoRef(db, session.uid, workId);
  const promoSnap = await promoDocRef.get();

  if (work.promoDraft) {
    await workRef.update({
      promoDraft: {
        ...work.promoDraft,
        thumbnailUrl,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  if (promoSnap.exists) {
    await promoDocRef.set(
      {
        thumbnailUrl,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return NextResponse.json({ ok: true, thumbnailUrl });
}
