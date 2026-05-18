import { NextResponse } from "next/server";
import { resolvePlaybackUrl } from "@/lib/cloudflare/stream";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { getDbOrNull, parsePromoDoc, parseWorkDoc, promoRef, worksCol } from "@/lib/server/works";
import { PROMO_SHORT_DOC_ID } from "@/types/work";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const queue = new URL(request.url).searchParams.get("queue") ?? "full_pending";

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  if (queue === "full_pending") {
    const snap = await db.collectionGroup("works").where("platformStatus", "==", "pending").get();
    const items = await Promise.all(
      snap.docs.map(async (doc) => {
        const work = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
        const ownerUid = doc.ref.parent.parent?.id ?? "";
        const userSnap = ownerUid ? await db.collection("users").doc(ownerUid).get() : null;
        const playbackUrl =
          work.streamUid && work.streamStatus === "ready"
            ? await resolvePlaybackUrl(work.streamUid)
            : undefined;
        return {
          ...work,
          ownerUid,
          ownerEmail: userSnap?.data()?.email ?? null,
          ownerName: userSnap?.data()?.displayName ?? null,
          playbackUrl,
        };
      })
    );
    return NextResponse.json({ items });
  }

  if (queue === "promo_pending") {
    const snap = await db.collectionGroup("promoShort").where("platformStatus", "==", "pending").get();
    const items = await Promise.all(
      snap.docs.map(async (promoDoc) => {
        const promo = parsePromoDoc(promoDoc.data() as Record<string, unknown>);
        const workRef = promoDoc.ref.parent.parent;
        if (!workRef) return null;
        const workId = workRef.id;
        const ownerUid = workRef.parent.parent?.id ?? "";
        const workSnap = await worksCol(db, ownerUid).doc(workId).get();
        if (!workSnap.exists) return null;
        const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
        const userSnap = await db.collection("users").doc(ownerUid).get();
        const playbackUrl =
          promo.streamUid && promo.streamStatus === "ready"
            ? await resolvePlaybackUrl(promo.streamUid)
            : undefined;
        return {
          promo: { id: PROMO_SHORT_DOC_ID, ...promo, playbackUrl },
          work,
          workId,
          ownerUid,
          ownerEmail: userSnap.data()?.email ?? null,
          ownerName: userSnap.data()?.displayName ?? null,
        };
      })
    );
    return NextResponse.json({ items: items.filter(Boolean) });
  }

  if (queue === "removal") {
    const [fullSnap, promoSnap] = await Promise.all([
      db.collectionGroup("works").where("platformStatus", "==", "removal_requested").get(),
      db.collectionGroup("promoShort").where("platformStatus", "==", "removal_requested").get(),
    ]);

    const items: Record<string, unknown>[] = [];

    for (const doc of fullSnap.docs) {
      const work = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
      const ownerUid = doc.ref.parent.parent?.id ?? "";
      const userSnap = await db.collection("users").doc(ownerUid).get();
      items.push({
        kind: "full",
        workId: doc.id,
        ownerUid,
        ownerEmail: userSnap.data()?.email,
        title: work.title,
        deletionRequest: work.deletionRequest,
      });
    }

    for (const promoDoc of promoSnap.docs) {
      const promo = parsePromoDoc(promoDoc.data() as Record<string, unknown>);
      const workRef = promoDoc.ref.parent.parent;
      if (!workRef) continue;
      const workId = workRef.id;
      const ownerUid = workRef.parent.parent?.id ?? "";
      const workSnap = await worksCol(db, ownerUid).doc(workId).get();
      const work = workSnap.exists
        ? parseWorkDoc(workId, workSnap.data() as Record<string, unknown>)
        : null;
      const userSnap = await db.collection("users").doc(ownerUid).get();
      items.push({
        kind: "promo",
        workId,
        ownerUid,
        ownerEmail: userSnap.data()?.email,
        title: promo.title ?? work?.title,
        deletionRequest: promo.deletionRequest,
      });
    }

    return NextResponse.json({ items });
  }

  return jsonError("invalid_queue", "알 수 없는 queue 입니다.", 400);
}
