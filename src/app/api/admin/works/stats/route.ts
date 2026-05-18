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
    });
  }

  const [fullPending, promoPending, fullRemoval, promoRemoval] = await Promise.all([
    db.collectionGroup("works").where("platformStatus", "==", "pending").get(),
    db.collectionGroup("promoShort").where("platformStatus", "==", "pending").get(),
    db.collectionGroup("works").where("platformStatus", "==", "removal_requested").get(),
    db.collectionGroup("promoShort").where("platformStatus", "==", "removal_requested").get(),
  ]);

  return NextResponse.json({
    pendingFull: fullPending.size,
    pendingPromo: promoPending.size,
    removalRequested: fullRemoval.size + promoRemoval.size,
  });
}
