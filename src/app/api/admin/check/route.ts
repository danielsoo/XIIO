import { NextResponse } from "next/server";
import { verifyBearerIdToken, getAdminAuth } from "@/lib/server/firebase-admin";
import { hasAdminAccess, hasSuperAdminAccess } from "@/lib/server/admin-uids";

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

  const isAdmin = hasAdminAccess(session.uid, session.email);
  const isSuperAdmin = hasSuperAdminAccess(session.uid, session.email);

  if (!isAdmin) {
    return NextResponse.json({
      ok: true,
      isAdmin: false,
      isSuperAdmin: false,
      uid: session.uid,
    });
  }

  return NextResponse.json({
    ok: true,
    isAdmin: true,
    isSuperAdmin,
    uid: session.uid,
  });
}
