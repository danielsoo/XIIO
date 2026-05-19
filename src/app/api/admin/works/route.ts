import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { resolvePlaybackUrl } from "@/lib/cloudflare/stream";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { getDbOrNull, parsePromoDoc, parseWorkDoc, promoRef, worksCol } from "@/lib/server/works";
import {
  syncPromoRevisionStreamStatusIfNeeded,
  syncPromoStreamStatusIfNeeded,
  syncWorkRevisionStreamStatusIfNeeded,
  syncWorkStreamStatusIfNeeded,
} from "@/lib/server/sync-stream-status";
import { PROMO_SHORT_DOC_ID } from "@/types/work";

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
      let work = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
      const ownerUid = doc.ref.parent.parent?.id ?? "";
      const rev = work.pendingRevision;
      const streamUid = isRevision ? rev?.streamUid : work.streamUid;
      let streamStatus = isRevision ? rev?.streamStatus : work.streamStatus;
      if (ownerUid && streamUid && streamStatus) {
        const synced = isRevision
          ? await syncWorkRevisionStreamStatusIfNeeded(db, ownerUid, doc.id, streamUid, streamStatus)
          : await syncWorkStreamStatusIfNeeded(db, ownerUid, doc.id, streamUid, streamStatus);
        streamStatus = synced ?? streamStatus;
        if (isRevision && rev) {
          work = { ...work, pendingRevision: { ...rev, streamStatus } };
        } else {
          work = { ...work, streamStatus };
        }
      }
      const userSnap = ownerUid ? await db.collection("users").doc(ownerUid).get() : null;
      const playbackUrl =
        streamUid && streamStatus === "ready" ? await resolvePlaybackUrl(streamUid) : undefined;
      return {
        ...work,
        ...(isRevision && rev
          ? {
              title: rev.title ?? work.title,
              section: rev.section ?? work.section,
              description: rev.description ?? work.description,
              director: rev.director ?? work.director,
              proposedCategory: rev.proposedCategory ?? work.proposedCategory,
              proposedTags: rev.proposedTags ?? work.proposedTags,
              proposedAspectRatio: rev.proposedAspectRatio ?? work.proposedAspectRatio,
            }
          : {}),
        ownerUid,
        ownerEmail: userSnap?.data()?.email ?? null,
        ownerName: userSnap?.data()?.displayName ?? null,
        playbackUrl,
        isRevision,
      };
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
      const parsed = parsePromoDoc(promoDoc.data() as Record<string, unknown>);
      const workRef = promoDoc.ref.parent.parent;
      if (!workRef) return null;
      const workId = workRef.id;
      const ownerUid = workRef.parent.parent?.id ?? "";
      const rev = parsed.pendingRevision;
      const streamUid = isRevision ? rev?.streamUid : parsed.streamUid;
      let streamStatus = isRevision ? rev?.streamStatus : parsed.streamStatus;
      if (ownerUid && streamUid && streamStatus) {
        streamStatus = isRevision
          ? await syncPromoRevisionStreamStatusIfNeeded(db, ownerUid, workId, streamUid, streamStatus)
          : await syncPromoStreamStatusIfNeeded(db, ownerUid, workId, streamUid, streamStatus);
      }
      const promo = isRevision && rev
        ? {
            ...parsed,
            title: rev.title ?? parsed.title,
            clipStartSec: rev.clipStartSec,
            clipEndSec: rev.clipEndSec,
            streamUid,
            streamStatus,
          }
        : { ...parsed, streamStatus };
      const workSnap = await worksCol(db, ownerUid).doc(workId).get();
      if (!workSnap.exists) return null;
      const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
      const userSnap = await db.collection("users").doc(ownerUid).get();
      const playbackUrl =
        streamUid && streamStatus === "ready" ? await resolvePlaybackUrl(streamUid) : undefined;
      return {
        promo: { id: PROMO_SHORT_DOC_ID, ...promo, playbackUrl },
        work,
        workId,
        ownerUid,
        ownerEmail: userSnap.data()?.email ?? null,
        ownerName: userSnap.data()?.displayName ?? null,
        isRevision,
      };
    };

    const items = (
      await Promise.all([
        ...snap.docs.map((d) => mapPromo(d, false)),
        ...revSnap.docs.map((d) => mapPromo(d, true)),
      ])
    ).filter(Boolean);
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
        title: work.title,
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
        title: promo.title ?? work?.title,
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
