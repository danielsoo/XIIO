import type { Firestore } from "firebase-admin/firestore";
import { isContentModerationEnabled } from "@/lib/server/moderation/config";
import {
  runContentModeration,
  type ModerationTargetKind,
  type RunContentModerationParams,
} from "@/lib/server/moderation/run-content-moderation";
import { parsePromoDoc, parseWorkDoc, promoRef, worksCol } from "@/lib/server/works";

const MODERATION_KINDS = new Set<ModerationTargetKind>([
  "full",
  "promo",
  "full_revision",
  "promo_revision",
]);

export function isModerationKind(kind: string): kind is ModerationTargetKind {
  return MODERATION_KINDS.has(kind as ModerationTargetKind);
}

export function scheduleContentModeration(
  db: Firestore,
  params: RunContentModerationParams
): void {
  if (!isContentModerationEnabled()) return;
  void runContentModeration(db, params).catch((e) => {
    console.error("[content-moderation] unhandled", params, e);
  });
}

export async function scheduleContentModerationFromMeta(
  db: Firestore,
  streamUid: string,
  xiioUid: string,
  workId: string,
  kind: string
): Promise<void> {
  if (!isContentModerationEnabled() || !isModerationKind(kind)) return;

  if (kind === "promo" || kind === "promo_revision") {
    const [workSnap, promoSnap] = await Promise.all([
      worksCol(db, xiioUid).doc(workId).get(),
      promoRef(db, xiioUid, workId).get(),
    ]);
    const work = workSnap.exists
      ? parseWorkDoc(workId, workSnap.data() as Record<string, unknown>)
      : null;
    const promo = promoSnap.exists
      ? parsePromoDoc(promoSnap.data() as Record<string, unknown>)
      : null;
    const rev = promo?.pendingRevision;
    const title =
      kind === "promo_revision"
        ? (rev?.title ?? promo?.title ?? work?.title ?? "Promo")
        : (promo?.title ?? work?.title ?? "Promo");

    scheduleContentModeration(db, {
      ownerUid: xiioUid,
      workId,
      streamUid,
      kind,
      title,
      description:
        kind === "promo_revision" ? rev?.description ?? promo?.description : promo?.description,
      director: work?.director,
      proposedCategory: work?.proposedCategory,
      proposedTags: work?.proposedTags,
    });
    return;
  }

  const workSnap = await worksCol(db, xiioUid).doc(workId).get();
  if (!workSnap.exists) return;
  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  const rev = work.pendingRevision;

  scheduleContentModeration(db, {
    ownerUid: xiioUid,
    workId,
    streamUid,
    kind,
    title: kind === "full_revision" ? (rev?.title ?? work.title) : work.title,
    description: kind === "full_revision" ? rev?.description ?? work.description : work.description,
    director: kind === "full_revision" ? rev?.director ?? work.director : work.director,
    proposedCategory:
      kind === "full_revision" ? rev?.proposedCategory ?? work.proposedCategory : work.proposedCategory,
    proposedTags:
      kind === "full_revision" ? rev?.proposedTags ?? work.proposedTags : work.proposedTags,
  });
}

export async function scheduleContentModerationByStreamUid(
  db: Firestore,
  streamUid: string
): Promise<void> {
  if (!isContentModerationEnabled()) return;

  const workSnap = await db.collectionGroup("works").where("streamUid", "==", streamUid).limit(5).get();
  for (const doc of workSnap.docs) {
    const ownerUid = doc.ref.parent.parent?.id ?? "";
    if (!ownerUid) continue;
    const work = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
    scheduleContentModeration(db, {
      ownerUid,
      workId: doc.id,
      streamUid,
      kind: "full",
      title: work.title,
      description: work.description,
      director: work.director,
      proposedCategory: work.proposedCategory,
      proposedTags: work.proposedTags,
    });
  }

  const promoSnap = await db
    .collectionGroup("promoShort")
    .where("streamUid", "==", streamUid)
    .limit(5)
    .get();
  for (const doc of promoSnap.docs) {
    const workRef = doc.ref.parent.parent;
    if (!workRef) continue;
    const workId = workRef.id;
    const ownerUid = workRef.parent.parent?.id ?? "";
    if (!ownerUid) continue;
    const promo = parsePromoDoc(doc.data() as Record<string, unknown>);
    const workSnap2 = await worksCol(db, ownerUid).doc(workId).get();
    const work = workSnap2.exists
      ? parseWorkDoc(workId, workSnap2.data() as Record<string, unknown>)
      : null;
    scheduleContentModeration(db, {
      ownerUid,
      workId,
      streamUid,
      kind: "promo",
      title: promo.title ?? work?.title ?? "Promo",
      description: promo.description,
      director: work?.director,
      proposedCategory: work?.proposedCategory,
      proposedTags: work?.proposedTags,
    });
  }
}
