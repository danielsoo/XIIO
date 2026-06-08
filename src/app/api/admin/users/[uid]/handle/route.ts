import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { resolveAdminAccess } from "@/lib/server/admin-access";
import { claimHandle, getUidByHandle } from "@/lib/server/handles";
import { normalizeHandle } from "@/lib/server/credits";
import { parseUserProfileDoc } from "@/lib/userAccess";
import { getDbOrNull } from "@/lib/server/works";

type Params = { params: Promise<{ uid: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const access = await resolveAdminAccess(auth.session.uid, auth.session.email);
  if (!access.isSuperAdmin) {
    return jsonError("forbidden", "슈퍼 어드민만 처리할 수 있습니다.", 403);
  }

  const { uid } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: { action?: string; adminNote?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const action = body.action;
  if (action !== "approve" && action !== "reject") {
    return jsonError("invalid_body", "action은 approve 또는 reject여야 합니다.", 400);
  }

  const adminNote = body.adminNote?.trim().slice(0, 500) || undefined;
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return jsonError("not_found", "회원을 찾을 수 없습니다.", 404);
  }

  const profile = parseUserProfileDoc(userSnap.data() as Record<string, unknown>);
  const req = profile.handleChangeRequest;
  if (!req || req.status !== "pending") {
    return jsonError("no_pending_request", "대기 중인 변경 신청이 없습니다.", 400);
  }

  const newHandle = normalizeHandle(req.requestedName);
  if (!newHandle) {
    return jsonError(
      "handle_invalid",
      "handle은 3~30자의 영문 소문자, 숫자, 밑줄(_), 마침표(.)만 사용할 수 있습니다. 앞뒤·연속 마침표는 불가합니다.",
      400
    );
  }

  const now = FieldValue.serverTimestamp();

  if (action === "approve") {
    const taken = await getUidByHandle(db, newHandle);
    if (taken && taken !== uid) {
      return jsonError("handle_taken", "이미 사용 중인 handle입니다.", 409);
    }
    const claimed = await claimHandle(db, uid, newHandle);
    if (!claimed.ok) {
      return jsonError(claimed.code, "handle을 반영할 수 없습니다.", 400);
    }
    await userRef.set(
      {
        handleChangeRequest: {
          ...req,
          status: "approved",
          resolvedAt: now,
          adminNote: adminNote ?? req.adminNote ?? null,
        },
        updatedAt: now,
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true, handle: newHandle, status: "approved" });
  }

  await userRef.set(
    {
      handleChangeRequest: {
        ...req,
        status: "rejected",
        resolvedAt: now,
        adminNote: adminNote ?? req.adminNote ?? null,
      },
      updatedAt: now,
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, status: "rejected" });
}
