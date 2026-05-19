import { NextResponse } from "next/server";
import { verifyBearerIdToken, getAdminDb, getFirebaseAdminApp } from "@/lib/server/firebase-admin";
import { assertAdminApiAccess } from "@/lib/server/admin-access";
import { parseUserProfileDoc } from "@/lib/userAccess";

export function jsonError(error: string, message: string, status: number, detail?: string) {
  return NextResponse.json(
    { error, message, ...(detail ? { detail } : {}) },
    { status }
  );
}

export async function requireUser(request: Request) {
  if (!getFirebaseAdminApp()) {
    return {
      error: jsonError(
        "admin_not_configured",
        "서버 Firebase Admin이 설정되지 않았습니다.",
        503
      ),
    };
  }
  const session = await verifyBearerIdToken(request.headers.get("authorization"));
  if (!session) {
    return {
      error: jsonError("unauthorized", "로그인이 필요합니다.", 401),
    };
  }
  return { session };
}

type AdminAuthOk = {
  session: { uid: string; email?: string };
  isSuperAdmin: boolean;
};

export async function requireAdmin(
  request: Request
): Promise<{ error: NextResponse } | AdminAuthOk> {
  const result = await requireUser(request);
  if (result.error) {
    return { error: result.error };
  }
  const ok = await assertAdminApiAccess(result.session.uid, result.session.email);
  if (!ok) {
    return { error: jsonError("forbidden", "권한이 없습니다.", 403) };
  }

  let isSuperAdmin = false;
  const db = getAdminDb();
  if (db) {
    const snap = await db.collection("users").doc(result.session.uid).get();
    if (snap.exists) {
      const profile = parseUserProfileDoc(snap.data() as Record<string, unknown>);
      isSuperAdmin = profile.role === "super_admin";
    }
  }

  return { session: result.session, isSuperAdmin };
}
