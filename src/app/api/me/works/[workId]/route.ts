import { NextResponse } from "next/server";
import { deleteStreamVideo } from "@/lib/cloudflare/stream";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import {
  canOwnerDeleteWork,
  getDbOrNull,
  parseWorkDoc,
  promoRef,
  worksCol,
} from "@/lib/server/works";

type Params = { params: Promise<{ workId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { workId } = await params;

  const db = await getDbOrNull();
  if (!db) {
    return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);
  }

  const ref = worksCol(db, session.uid).doc(workId);
  const snap = await ref.get();
  if (!snap.exists) {
    return jsonError("not_found", "작품을 찾을 수 없습니다.", 404);
  }

  const work = parseWorkDoc(workId, snap.data() as Record<string, unknown>);
  if (!canOwnerDeleteWork(work.platformStatus)) {
    return jsonError(
      "delete_forbidden",
      "게시된 작품은 삭제할 수 없습니다. 삭제 요청을 이용하세요.",
      403
    );
  }

  const promoSnap = await promoRef(db, session.uid, workId).get();
  if (promoSnap.exists) {
    const promoUid = promoSnap.data()?.streamUid as string | undefined;
    if (promoUid) {
      try {
        await deleteStreamVideo(promoUid);
      } catch (e) {
        console.warn("[delete work] promo stream:", e);
      }
    }
    await promoRef(db, session.uid, workId).delete();
  }

  if (work.streamUid) {
    try {
      await deleteStreamVideo(work.streamUid);
    } catch (e) {
      console.warn("[delete work] full stream:", e);
    }
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
