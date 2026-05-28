import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { resolvePlaybackUrl } from "@/lib/cloudflare/stream";
import {
  mapFullWorkQueueItem,
  mapPromoWorkQueueItem,
} from "@/lib/server/admin-work-queue-map";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { FALLBACK_WORK_TITLE, resolveDisplayTitle } from "@/lib/works/display-title";
import { getDbOrNull, parsePromoDoc, parseWorkDoc, worksCol } from "@/lib/server/works";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const queue = new URL(request.url).searchParams.get("queue") ?? "full_pending";

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  if (queue === "full_pending") {
    const [snap, revSnap] = await Promise.all([
      db.collectionGroup("works").where("platformStatus", "==", "pending").get(),
      db.collectionGroup("works").where("revisionReviewStatus", "==", "pending").get(),
    ]);
    const seen = new Set<string>();

    const mapDoc = async (doc: QueryDocumentSnapshot, isRevision: boolean) => {
      const key = doc.ref.path;
      if (seen.has(key)) return null;
      seen.add(key);
      return mapFullWorkQueueItem(db, doc, isRevision);
    };

    const items = (
      await Promise.all([
        ...snap.docs.map((d) => mapDoc(d, false)),
        ...revSnap.docs.map((d) => mapDoc(d, true)),
      ])
    ).filter(Boolean);
    return NextResponse.json({ items });
  }

  if (queue === "promo_pending") {
    const [snap, revSnap] = await Promise.all([
      db.collectionGroup("promoShort").where("platformStatus", "==", "pending").get(),
      db.collectionGroup("promoShort").where("revisionReviewStatus", "==", "pending").get(),
    ]);
    const seen = new Set<string>();

    const mapPromo = async (promoDoc: QueryDocumentSnapshot, isRevision: boolean) => {
      const key = promoDoc.ref.path;
      if (seen.has(key)) return null;
      seen.add(key);
      return mapPromoWorkQueueItem(db, promoDoc, isRevision);
    };

    const items = (
      await Promise.all([
        ...snap.docs.map((d) => mapPromo(d, false)),
        ...revSnap.docs.map((d) => mapPromo(d, true)),
      ])
    ).filter(Boolean);
    return NextResponse.json({ items });
  }

  if (queue === "ai_flagged") {
    const [fullSnap, fullRevSnap, promoSnap, promoRevSnap] = await Promise.all([
      db
        .collectionGroup("works")
        .where("platformStatus", "==", "pending")
        .where("contentModeration.hasHighSeverity", "==", true)
        .get(),
      db
        .collectionGroup("works")
        .where("revisionReviewStatus", "==", "pending")
        .where("pendingRevision.contentModeration.hasHighSeverity", "==", true)
        .get(),
      db
        .collectionGroup("promoShort")
        .where("platformStatus", "==", "pending")
        .where("contentModeration.hasHighSeverity", "==", true)
        .get(),
      db
        .collectionGroup("promoShort")
        .where("revisionReviewStatus", "==", "pending")
        .where("pendingRevision.contentModeration.hasHighSeverity", "==", true)
        .get(),
    ]);

    const seen = new Set<string>();
    const items: Record<string, unknown>[] = [];

    const mapFullAi = async (doc: QueryDocumentSnapshot, isRevision: boolean) => {
      const key = doc.ref.path;
      if (seen.has(key)) return;
      seen.add(key);
      const row = await mapFullWorkQueueItem(db, doc, isRevision);
      items.push({ queueKind: "full", ...row });
    };

    await Promise.all([
      ...fullSnap.docs.map((d) => mapFullAi(d, false)),
      ...fullRevSnap.docs.map((d) => mapFullAi(d, true)),
    ]);

    const mapPromoAi = async (doc: QueryDocumentSnapshot, isRevision: boolean) => {
      const key = doc.ref.path;
      if (seen.has(key)) return;
      seen.add(key);
      const row = await mapPromoWorkQueueItem(db, doc, isRevision);
      if (row) items.push({ queueKind: "promo", ...row });
    };

    await Promise.all([
      ...promoSnap.docs.map((d) => mapPromoAi(d, false)),
      ...promoRevSnap.docs.map((d) => mapPromoAi(d, true)),
    ]);

    return NextResponse.json({ items });
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
      const playbackUrl =
        work.streamUid && work.streamStatus === "ready"
          ? await resolvePlaybackUrl(work.streamUid)
          : undefined;
      items.push({
        kind: "full",
        workId: doc.id,
        ownerUid,
        ownerEmail: userSnap.data()?.email ?? null,
        ownerName: userSnap.data()?.displayName ?? null,
        title: resolveDisplayTitle(FALLBACK_WORK_TITLE, work.title),
        section: work.section,
        platformStatus: work.platformStatus,
        streamStatus: work.streamStatus,
        deletionRequest: work.deletionRequest,
        playbackUrl,
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
      const playbackUrl =
        promo.streamUid && promo.streamStatus === "ready"
          ? await resolvePlaybackUrl(promo.streamUid)
          : undefined;
      items.push({
        kind: "promo",
        workId,
        ownerUid,
        ownerEmail: userSnap.data()?.email ?? null,
        ownerName: userSnap.data()?.displayName ?? null,
        title: resolveDisplayTitle(FALLBACK_WORK_TITLE, promo.title, work?.title),
        section: work?.section,
        platformStatus: promo.platformStatus,
        streamStatus: promo.streamStatus,
        deletionRequest: promo.deletionRequest,
        playbackUrl,
      });
    }

    return NextResponse.json({ items });
  }

  return jsonError("invalid_queue", "알 수 없는 queue 입니다.", 400);
}
