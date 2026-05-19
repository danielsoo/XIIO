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
      removalRequested: 0,
      pendingReports: 0,
    });
  }

  const [
    fullPending,
    fullRevision,
    promoPending,
    promoRevision,
    fullRemoval,
    promoRemoval,
    pendingReportsSnap,
  ] = await Promise.all([
    db.collectionGroup("works").where("platformStatus", "==", "pending").get(),
    db.collectionGroup("works").where("revisionReviewStatus", "==", "pending").get(),
    db.collectionGroup("promoShort").where("platformStatus", "==", "pending").get(),
    db.collectionGroup("promoShort").where("revisionReviewStatus", "==", "pending").get(),
    db.collectionGroup("works").where("platformStatus", "==", "removal_requested").get(),
    db.collectionGroup("promoShort").where("platformStatus", "==", "removal_requested").get(),
    db.collection("reports").where("status", "==", "pending").get(),
  ]);

  return NextResponse.json({
    pendingFull: fullPending.size + fullRevision.size,
    pendingPromo: promoPending.size + promoRevision.size,
    removalRequested: fullRemoval.size + promoRemoval.size,
    pendingReports: pendingReportsSnap.size,
  });
}
