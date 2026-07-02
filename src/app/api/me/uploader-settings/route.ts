import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { getDbOrNull, worksCol } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";

const MAX_DIRECTOR_LEN = 120;

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const db = await getDbOrNull();
  if (!db) {
    return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);
  }

  const userSnap = await db.collection("users").doc(session.uid).get();
  const profile = userSnap.exists
    ? parseUserProfileDoc(userSnap.data() as Record<string, unknown>)
    : null;

  const worksSnap = await worksCol(db, session.uid).limit(1).get();
  const defaultDirectorName = profile?.defaultDirectorName?.trim() || null;
  const schoolNameHint = profile?.schoolName?.trim() || null;
  const req = profile?.directorNameChangeRequest;

  return NextResponse.json({
    defaultDirectorName,
    schoolNameHint,
    hasWorks: !worksSnap.empty,
    directorNameChangeRequest: req
      ? {
          requestedName: req.requestedName,
          reason: req.reason,
          status: req.status,
          requestedAt: req.requestedAt,
          resolvedAt: req.resolvedAt,
          adminNote: req.adminNote,
        }
      : null,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const db = await getDbOrNull();
  if (!db) {
    return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);
  }

  let body: { defaultDirectorName?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const name = body.defaultDirectorName?.trim().slice(0, MAX_DIRECTOR_LEN) ?? "";
  if (!name) {
    return jsonError("invalid_body", "감독 이름을 입력해 주세요.", 400);
  }

  const userSnap = await db.collection("users").doc(session.uid).get();
  const profile = userSnap.exists
    ? parseUserProfileDoc(userSnap.data() as Record<string, unknown>)
    : null;
  if (profile?.defaultDirectorName?.trim()) {
    return jsonError(
      "director_name_locked",
      "감독 이름은 이미 설정되어 있습니다. 변경은 설정에서 신청해 주세요.",
      409
    );
  }

  await db.collection("users").doc(session.uid).set(
    {
      defaultDirectorName: name,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, defaultDirectorName: name });
}
