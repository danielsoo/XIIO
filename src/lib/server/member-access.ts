import type { Firestore } from "firebase-admin/firestore";
import type { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/api-auth";
import { resolveMemberAccess, type MemberAccessResult } from "@/lib/userAccess";
import { isProfileComplete } from "@/lib/userProfile";

export type MemberAccessKind = "active" | "no_profile" | "deleted";

export function memberAccessKindFromResult(result: MemberAccessResult): MemberAccessKind {
  if (result.kind === "deleted") return "deleted";
  if (result.kind === "active") {
    return isProfileComplete(result.profile) ? "active" : "no_profile";
  }
  return "no_profile";
}

export async function getMemberAccessForUid(
  db: Firestore,
  uid: string
): Promise<{ result: MemberAccessResult; kind: MemberAccessKind; profileComplete: boolean }> {
  const snap = await db.collection("users").doc(uid).get();
  const result = resolveMemberAccess(
    snap.exists,
    snap.exists ? (snap.data() as Record<string, unknown>) : undefined
  );
  const kind = memberAccessKindFromResult(result);
  return {
    result,
    kind,
    profileComplete: kind === "active",
  };
}

export function profileRequiredResponse(): NextResponse {
  return jsonError(
    "profile_required",
    "가입 설문을 완료한 회원만 업로드할 수 있습니다. 회원가입을 마무리해 주세요.",
    403
  );
}

/** null = OK; otherwise return this response from the route handler. */
export async function requireCompleteMemberProfile(
  db: Firestore,
  uid: string
): Promise<NextResponse | null> {
  const { kind } = await getMemberAccessForUid(db, uid);
  if (kind === "deleted") {
    return jsonError(
      "account_deleted",
      "탈퇴한 계정입니다. 다시 이용하려면 새로 가입해 주세요.",
      403
    );
  }
  if (kind !== "active") return profileRequiredResponse();
  return null;
}
