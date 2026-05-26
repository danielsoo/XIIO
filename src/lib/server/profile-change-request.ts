import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { DirectorNameChangeRequest } from "@/types/user";
import { parseUserProfileDoc } from "@/lib/userAccess";

const MAX_NAME_LEN = 120;
const MAX_REASON_LEN = 500;

export type ChangeRequestField = "displayNameChangeRequest" | "handleChangeRequest";

export function buildPendingChangeRequest(
  requestedName: string,
  reason?: string
): Record<string, unknown> {
  return {
    requestedName,
    reason,
    status: "pending",
    requestedAt: FieldValue.serverTimestamp(),
    resolvedAt: null,
    adminNote: null,
  };
}

export async function submitUserChangeRequest(opts: {
  db: Firestore;
  uid: string;
  field: ChangeRequestField;
  requestedName: string;
  reason?: string;
  currentValue: string | undefined;
  requireCurrent: boolean;
  sameValueError: string;
}): Promise<
  | { ok: true; request: DirectorNameChangeRequest }
  | { ok: false; code: string; message: string; status: number }
> {
  const requestedName = opts.requestedName.trim().slice(0, MAX_NAME_LEN);
  if (!requestedName) {
    return { ok: false, code: "invalid_body", message: "변경 희망 값을 입력해 주세요.", status: 400 };
  }

  const reason = opts.reason?.trim().slice(0, MAX_REASON_LEN) || undefined;
  const userRef = opts.db.collection("users").doc(opts.uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return { ok: false, code: "not_found", message: "프로필을 찾을 수 없습니다.", status: 404 };
  }

  const profile = parseUserProfileDoc(userSnap.data() as Record<string, unknown>);
  const current = opts.currentValue?.trim() ?? "";

  if (opts.requireCurrent && !current) {
    return {
      ok: false,
      code: "not_set",
      message: "먼저 설정한 뒤 변경 신청할 수 있습니다.",
      status: 400,
    };
  }

  if (current && requestedName === current) {
    return { ok: false, code: "invalid_body", message: opts.sameValueError, status: 400 };
  }

  const pendingDisplay = profile.displayNameChangeRequest?.status === "pending";
  const pendingHandle = profile.handleChangeRequest?.status === "pending";
  const pendingDirector = profile.directorNameChangeRequest?.status === "pending";
  if (pendingDisplay || pendingHandle || pendingDirector) {
    return {
      ok: false,
      code: "change_request_pending",
      message: "이미 심사 중인 변경 신청이 있습니다.",
      status: 409,
    };
  }

  const request = buildPendingChangeRequest(requestedName, reason);
  await userRef.set(
    {
      [opts.field]: request,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    ok: true,
    request: {
      requestedName,
      reason,
      status: "pending" as const,
    },
  };
}
