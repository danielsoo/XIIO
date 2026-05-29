import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getDbOrNull } from "@/lib/server/works";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) {
    return NextResponse.json({
      pendingFull: 0,
      pendingPromo: 0,
      pendingPrologue: 0,
      aiFlagged: 0,
      removalRequested: 0,
      pendingReports: 0,
    });
  }

  const [
    fullPending,
    fullRevision,
    promoPending,
    promoRevision,
    prologuePending,
    prologueRevision,
    aiFull,
    aiFullRev,
    aiPromo,
    aiPromoRev,
    fullRemoval,
    promoRemoval,
    pendingReportsSnap,
  ] = await Promise.all([
    db.collectionGroup("works").where("platformStatus", "==", "pending").get(),
    db.collectionGroup("works").where("revisionReviewStatus", "==", "pending").get(),
    db.collectionGroup("promoShort").where("platformStatus", "==", "pending").get(),
    db.collectionGroup("promoShort").where("revisionReviewStatus", "==", "pending").get(),
    db.collectionGroup("prologueShort").where("platformStatus", "==", "pending").get(),
    db.collectionGroup("prologueShort").where("revisionReviewStatus", "==", "pending").get(),
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
    db.collectionGroup("works").where("platformStatus", "==", "removal_requested").get(),
    db.collectionGroup("promoShort").where("platformStatus", "==", "removal_requested").get(),
    db.collection("reports").where("status", "==", "pending").get(),
  ]);

  const aiKeys = new Set<string>();
  for (const d of aiFull.docs) aiKeys.add(`w_${d.ref.path}`);
  for (const d of aiFullRev.docs) aiKeys.add(`w_${d.ref.path}`);
  for (const d of aiPromo.docs) aiKeys.add(`p_${d.ref.path}`);
  for (const d of aiPromoRev.docs) aiKeys.add(`p_${d.ref.path}`);

  return NextResponse.json({
    pendingFull: fullPending.size + fullRevision.size,
    pendingPromo: promoPending.size + promoRevision.size,
    pendingPrologue: prologuePending.size + prologueRevision.size,
    aiFlagged: aiKeys.size,
    removalRequested: fullRemoval.size + promoRemoval.size,
    pendingReports: pendingReportsSnap.size,
  });
}
