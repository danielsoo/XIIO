import type { UserProfileDoc } from "@/types/user";
import {
  canAccessAdminPanel,
  DEFAULT_ADMIN_ALLOWED_ROLES,
  isSuperAdminRole,
  parseUserProfileDoc,
} from "@/lib/userAccess";
import { getAdminDb } from "@/lib/server/firebase-admin";
import {
  hasAdminAccess as envHasAdminAccess,
  hasSuperAdminAccess as envHasSuperAdminAccess,
} from "@/lib/server/admin-uids";

export type AdminResolveResult = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  source: "env" | "firestore" | "none";
};

async function getAllowedAdminRoles(): Promise<string[]> {
  const db = getAdminDb();
  if (!db) return [...DEFAULT_ADMIN_ALLOWED_ROLES];
  try {
    const snap = await db.collection("config").doc("adminAccess").get();
    const roles = snap.data()?.allowedRoles;
    if (Array.isArray(roles) && roles.length > 0) {
      return roles.map((r) => String(r));
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_ADMIN_ALLOWED_ROLES];
}

async function getUserProfileServer(uid: string): Promise<UserProfileDoc | null> {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  return parseUserProfileDoc(snap.data() as Record<string, unknown>);
}

/** asme_web: Firestore users + config/adminAccess (+ env 부트스트랩) */
export async function resolveAdminAccess(
  uid: string,
  email?: string
): Promise<AdminResolveResult> {
  if (envHasSuperAdminAccess(uid, email)) {
    return { isAdmin: true, isSuperAdmin: true, source: "env" };
  }
  if (envHasAdminAccess(uid, email)) {
    return { isAdmin: true, isSuperAdmin: false, source: "env" };
  }

  const profile = await getUserProfileServer(uid);
  const allowedRoles = await getAllowedAdminRoles();
  if (profile && canAccessAdminPanel(profile, allowedRoles)) {
    return {
      isAdmin: true,
      isSuperAdmin: isSuperAdminRole(profile.role),
      source: "firestore",
    };
  }

  return { isAdmin: false, isSuperAdmin: false, source: "none" };
}

export async function assertAdminApiAccess(uid: string, email?: string): Promise<boolean> {
  const { isAdmin } = await resolveAdminAccess(uid, email);
  return isAdmin;
}
