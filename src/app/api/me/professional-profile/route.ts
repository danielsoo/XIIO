import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { jsonError, requireUser } from "@/lib/server/api-auth";
import { claimHandle } from "@/lib/server/handles";
import { isProfessionalField } from "@/types/portfolio";
import { getDbOrNull } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const snap = await db.collection("users").doc(auth.session.uid).get();
  if (!snap.exists) return jsonError("profile_not_found", "프로필이 없습니다.", 404);

  const profile = parseUserProfileDoc(snap.data() as Record<string, unknown>);
  return NextResponse.json({
    handle: profile.handle ?? null,
    headline: profile.headline ?? null,
    bio: profile.bio ?? null,
    primaryField: profile.primaryField ?? null,
    crewRoles: profile.crewRoles ?? [],
    isDiscoverable: profile.isDiscoverable !== false,
    displayName: profile.displayName,
    defaultDirectorName: profile.defaultDirectorName ?? null,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  let body: {
    handle?: string;
    headline?: string;
    bio?: string;
    primaryField?: string;
    crewRoles?: string[];
    isDiscoverable?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("invalid_json", "요청 형식(JSON)이 올바르지 않습니다.", 400);
  }

  const uid = auth.session.uid;
  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  if (body.headline !== undefined) {
    updates.headline = body.headline.trim().slice(0, 200) || null;
  }
  if (body.bio !== undefined) {
    updates.bio = body.bio.trim().slice(0, 2000) || null;
  }
  if (body.primaryField !== undefined) {
    const pf = body.primaryField.trim();
    if (pf && !isProfessionalField(pf)) {
      return jsonError("invalid_field", "유효하지 않은 활동 분야입니다.", 400);
    }
    updates.primaryField = pf || null;
  }
  if (body.crewRoles !== undefined) {
    updates.crewRoles = Array.isArray(body.crewRoles)
      ? body.crewRoles.map((x) => String(x).trim()).filter(Boolean).slice(0, 10)
      : [];
  }
  if (body.isDiscoverable !== undefined) {
    updates.isDiscoverable = !!body.isDiscoverable;
  }

  const profileMerge =
    Object.keys(updates).length > 1
      ? Object.fromEntries(Object.entries(updates).filter(([k]) => k !== "updatedAt"))
      : undefined;

  if (body.handle !== undefined && body.handle.trim()) {
    const result = await claimHandle(db, uid, body.handle, profileMerge);
    if (!result.ok) {
      const msg =
        result.code === "handle_taken"
          ? "이미 사용 중인 handle입니다."
          : "handle은 3~30자의 영문 소문자, 숫자, 밑줄만 사용할 수 있습니다.";
      return jsonError(result.code, msg, result.code === "handle_taken" ? 409 : 400);
    }
  } else if (profileMerge && Object.keys(profileMerge).length > 0) {
    await db.collection("users").doc(uid).set(updates, { merge: true });
  }

  const snap = await db.collection("users").doc(uid).get();
  const profile = parseUserProfileDoc(snap.data() as Record<string, unknown>);
  return NextResponse.json({
    handle: profile.handle ?? null,
    headline: profile.headline ?? null,
    bio: profile.bio ?? null,
    primaryField: profile.primaryField ?? null,
    crewRoles: profile.crewRoles ?? [],
    isDiscoverable: profile.isDiscoverable !== false,
  });
}
