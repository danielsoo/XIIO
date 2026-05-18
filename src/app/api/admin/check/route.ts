import { NextResponse } from "next/server";
import { verifyBearerIdToken, getAdminAuth } from "@/lib/server/firebase-admin";
import { resolveAdminAccess } from "@/lib/server/admin-access";

export async function GET(request: Request) {
  if (!getAdminAuth()) {
    return NextResponse.json(
      { ok: false, isAdmin: false, reason: "admin_sdk_missing" },
      { status: 503 }
    );
  }

  const session = await verifyBearerIdToken(request.headers.get("authorization"));
  if (!session) {
    return NextResponse.json(
      { ok: false, isAdmin: false, reason: "unauthorized" },
      { status: 401 }
    );
  }

  const { isAdmin, isSuperAdmin, source } = await resolveAdminAccess(
    session.uid,
    session.email
  );

  return NextResponse.json({
    ok: true,
    isAdmin,
    isSuperAdmin,
    source,
    uid: session.uid,
    ...(isAdmin ? {} : { reason: "unauthorized" as const }),
  });
}
