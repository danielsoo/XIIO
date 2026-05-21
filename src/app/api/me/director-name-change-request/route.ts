import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { getDbOrNull } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";

const MAX_NAME_LEN = 120;
const MAX_REASON_LEN = 500;

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const db = await getDbOrNull();
  if (!db) {
    return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);
  }

  let body: { requestedName?: string; reason?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const requestedName = body.requestedName?.trim().slice(0, MAX_NAME_LEN) ?? "";
  if (!requestedName) {
    return jsonError("invalid_body", "변경 희망 이름을 입력해 주세요.", 400);
  }

  const reason = body.reason?.trim().slice(0, MAX_REASON_LEN) || undefined;

  const userRef = db.collection("users").doc(session.uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return jsonError("not_found", "프로필을 찾을 수 없습니다.", 404);
  }

  const profile = parseUserProfileDoc(userSnap.data() as Record<string, unknown>);
  if (!profile.defaultDirectorName?.trim()) {
    return jsonError(
      "director_name_not_set",
      "감독 이름을 먼저 설정한 뒤 변경 신청할 수 있습니다.",
      400
    );
  }

  if (requestedName === profile.defaultDirectorName.trim()) {
    return jsonError("invalid_body", "현재 이름과 동일합니다.", 400);
  }

  if (profile.directorNameChangeRequest?.status === "pending") {
    return jsonError(
      "change_request_pending",
      "이미 심사 중인 변경 신청이 있습니다.",
      409
    );
  }

  const directorNameChangeRequest = {
    requestedName,
    reason,
    status: "pending" as const,
    requestedAt: FieldValue.serverTimestamp(),
    resolvedAt: null,
    adminNote: null,
  };

  await userRef.set(
    {
      directorNameChangeRequest,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, directorNameChangeRequest });
}
