import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  buildPublicPortfolio,
  findPortfolioShareByToken,
  portfolioSharesCol,
} from "@/lib/server/portfolio";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  const db = await getDbOrNull();
  if (!db) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const found = await findPortfolioShareByToken(db, token);
  if (!found || found.share.visibility !== "active") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (found.share.expiresAt) {
    const exp = found.share.expiresAt as { toDate?: () => Date };
    const expDate = typeof exp?.toDate === "function" ? exp.toDate() : null;
    if (expDate && expDate.getTime() < Date.now()) {
      return NextResponse.json({ error: "expired" }, { status: 410 });
    }
  }

  const payload = await buildPublicPortfolio(db, found.uid, found.share);
  if (!payload) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await portfolioSharesCol(db, found.uid).doc(found.shareId).update({
    viewCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json(payload);
}
