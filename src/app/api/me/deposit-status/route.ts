import { NextResponse } from "next/server";
import { verifyBearerIdToken } from "@/lib/server/firebase-admin";
import { hasDepositVerifiedClaim } from "@/lib/server/deposit-verification";
import { isUploaderDepositEnabled } from "@/lib/payments/config";

export async function GET(request: Request) {
  const session = await verifyBearerIdToken(request.headers.get("authorization"));
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const depositVerified = await hasDepositVerifiedClaim(session.uid);

  return NextResponse.json({
    depositVerified,
    uploaderDepositEnabled: isUploaderDepositEnabled(),
  });
}
