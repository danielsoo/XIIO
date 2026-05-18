import type { UserRole, UserProfileDoc } from "@/types/user";

export const DEFAULT_ADMIN_ALLOWED_ROLES: UserRole[] = ["admin", "super_admin"];

export type MemberAccessResult =
  | { kind: "none" }
  | { kind: "no_profile" }
  | { kind: "active"; profile: UserProfileDoc };

export function parseUserProfileDoc(data: Record<string, unknown>): UserProfileDoc {
  return {
    displayName: String(data.displayName ?? ""),
    age: typeof data.age === "number" ? data.age : 0,
    isStudent: !!data.isStudent,
    schoolName: data.schoolName ? String(data.schoolName) : undefined,
    platformPurpose: data.platformPurpose === "upload" ? "upload" : "watch",
    email: data.email != null ? String(data.email) : null,
    emailVerified: !!data.emailVerified,
    role: (["member", "admin", "super_admin"].includes(String(data.role))
      ? data.role
      : "member") as UserRole,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export function resolveMemberAccess(
  exists: boolean,
  data: Record<string, unknown> | undefined
): MemberAccessResult {
  if (!exists || !data) return { kind: "no_profile" };
  return { kind: "active", profile: parseUserProfileDoc(data) };
}

export function canAccessAdminPanel(
  profile: Pick<UserProfileDoc, "role"> | null | undefined,
  allowedRoles: string[]
): boolean {
  if (!profile) return false;
  const role = profile.role ?? "member";
  if (role === "super_admin" || role === "admin") return true;
  return allowedRoles.includes(role);
}

export function isSuperAdminRole(role: string | undefined): boolean {
  return role === "super_admin";
}
