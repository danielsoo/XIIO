import { NextResponse } from "next/server";
import { resolvePlaybackUrl } from "@/lib/cloudflare/stream";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import {
  getDbOrNull,
  parsePromoDoc,
  parseWorkDoc,
  promoRef,
  worksCol,
} from "@/lib/server/works";
import { PROMO_SHORT_DOC_ID } from "@/types/work";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const db = await getDbOrNull();
  if (!db) {
    return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);
  }

  const snap = await worksCol(db, session.uid).orderBy("sortOrder", "asc").get();
  const items = await Promise.all(
    snap.docs.map(async (doc) => {
      const work = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
      const promoSnap = await promoRef(db, session.uid, doc.id).get();
      let promo = null;
      if (promoSnap.exists) {
        promo = {
          id: PROMO_SHORT_DOC_ID,
          ...parsePromoDoc(promoSnap.data() as Record<string, unknown>),
        };
      }
      let playbackUrl: string | undefined;
      if (work.streamStatus === "ready" && work.streamUid) {
        playbackUrl = (await resolvePlaybackUrl(work.streamUid)) ?? undefined;
      }
      return { ...work, promo, playbackUrl };
    })
  );

  return NextResponse.json({ works: items });
}
