import { NextResponse } from "next/server";
import { Timestamp, type Query } from "firebase-admin/firestore";
import { jsonError, requireAdmin } from "@/lib/server/api-auth";
import { parseUserProfileDoc } from "@/lib/userAccess";
import { getDbOrNull } from "@/lib/server/works";
import type { AdminUserListItem, AdminUsersListResponse } from "@/types/admin";
import type { PlatformPurpose, UserRole } from "@/types/user";

const PURPOSES: PlatformPurpose[] = ["watch", "upload"];
const ROLES: UserRole[] = ["member", "admin", "super_admin"];

function docToListItem(uid: string, data: Record<string, unknown>): AdminUserListItem {
  const profile = parseUserProfileDoc(data);
  return {
    uid,
    displayName: profile.displayName,
    email: profile.email,
    platformPurpose: profile.platformPurpose,
    role: profile.role,
    emailVerified: profile.emailVerified,
    createdAt: profile.createdAt,
  };
}

function encodeCursor(createdAt: Timestamp, uid: string): string {
  return Buffer.from(`${createdAt.toMillis()},${uid}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): { millis: number; uid: string } | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const idx = raw.lastIndexOf(",");
    if (idx < 0) return null;
    const millis = Number(raw.slice(0, idx));
    const uid = raw.slice(idx + 1);
    if (!Number.isFinite(millis) || !uid) return null;
    return { millis, uid };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const db = await getDbOrNull();
  if (!db) return jsonError("admin_not_configured", "서버 DB를 사용할 수 없습니다.", 503);

  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 25));
  const cursorParam = url.searchParams.get("cursor")?.trim() || null;
  const purposeParam = url.searchParams.get("purpose")?.trim() ?? "";
  const roleParam = url.searchParams.get("role")?.trim() ?? "";
  const q = url.searchParams.get("q")?.trim() ?? "";

  if (q) {
    let items: AdminUserListItem[] = [];
    if (q.includes("@")) {
      const snap = await db.collection("users").where("email", "==", q).limit(1).get();
      items = snap.docs.map((d) => docToListItem(d.id, d.data() as Record<string, unknown>));
    } else {
      const snap = await db.collection("users").doc(q).get();
      if (snap.exists) {
        items = [docToListItem(snap.id, snap.data() as Record<string, unknown>)];
      }
    }
    const payload: AdminUsersListResponse = { items, nextCursor: null };
    return NextResponse.json(payload);
  }

  const purpose = PURPOSES.includes(purposeParam as PlatformPurpose)
    ? (purposeParam as PlatformPurpose)
    : null;
  const role = ROLES.includes(roleParam as UserRole) ? (roleParam as UserRole) : null;

  let query: Query = db.collection("users");
  if (purpose) query = query.where("platformPurpose", "==", purpose);
  if (role) query = query.where("role", "==", role);
  query = query.orderBy("createdAt", "desc");

  if (cursorParam) {
    const decoded = decodeCursor(cursorParam);
    if (decoded) {
      const cursorSnap = await db.collection("users").doc(decoded.uid).get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap);
      }
    }
  }

  const snap = await query.limit(limit + 1).get();
  const docs = snap.docs;
  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;

  const items = pageDocs.map((d) => docToListItem(d.id, d.data() as Record<string, unknown>));

  let nextCursor: string | null = null;
  if (hasMore && pageDocs.length > 0) {
    const last = pageDocs[pageDocs.length - 1]!;
    const createdAt = last.data().createdAt;
    if (createdAt instanceof Timestamp) {
      nextCursor = encodeCursor(createdAt, last.id);
    }
  }

  const payload: AdminUsersListResponse = { items, nextCursor };
  return NextResponse.json(payload);
}
