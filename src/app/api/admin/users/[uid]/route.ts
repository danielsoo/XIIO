import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { parseUserProfileDoc } from "@/lib/userAccess";
import { getUserActivity } from "@/lib/server/user-activity";
import { getDbOrNull, parseWorkDoc, worksCol } from "@/lib/server/works";
import type { AdminUserDetail } from "@/types/admin";

type Params = { params: Promise<{ uid: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { uid } = await params;
  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    return jsonError("not_found", "회원을 찾을 수 없습니다.", 404);
  }

  const profile = parseUserProfileDoc(userSnap.data() as Record<string, unknown>);
  const activity = await getUserActivity(uid);

  const billingSnap = await db.collection("users").doc(uid).collection("private").doc("billing").get();
  const depositVerified = billingSnap.exists && !!billingSnap.data()?.depositVerified;

  const worksSnap = await worksCol(db, uid).orderBy("sortOrder", "asc").get();
  const works = worksSnap.docs.map((doc) => {
    const w = parseWorkDoc(doc.id, doc.data() as Record<string, unknown>);
    return {
      id: w.id,
      title: w.title,
      section: w.section,
      platformStatus: w.platformStatus,
      streamStatus: w.streamStatus,
      proposedCategory: w.proposedCategory,
      approvedCategory: w.approvedCategory,
      createdAt: w.createdAt,
    };
  });

  const detail: AdminUserDetail = {
    uid,
    displayName: profile.displayName,
    email: profile.email,
    emailVerified: profile.emailVerified,
    age: profile.age ?? null,
    birthDate: profile.birthDate ?? null,
    gender: profile.gender ?? null,
    locale: profile.locale ?? null,
    isStudent: profile.isStudent,
    schoolName: profile.schoolName,
    platformPurpose: profile.platformPurpose,
    role: profile.role,
    defaultDirectorName: profile.defaultDirectorName,
    directorNameChangeRequest: profile.directorNameChangeRequest,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    visitCount: activity.visitCount,
    lastVisitAt: activity.lastVisitAt,
    depositVerified,
    works,
  };

  return NextResponse.json(detail);
}
