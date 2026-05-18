/**
 * Admin allowlist — server-only (no NEXT_PUBLIC_).
 * - ADMIN_UIDS: comma-separated Firebase Auth UIDs
 * - ADMIN_EMAILS: comma-separated emails (any admin)
 * - ADMIN_SUPER_EMAIL: top-tier admin (also counts as admin)
 */

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getAdminUidSet(): Set<string> {
  return new Set(parseList(process.env.ADMIN_UIDS));
}

export function getAdminEmailSet(): Set<string> {
  const emails = [
    ...parseList(process.env.ADMIN_EMAILS),
    ...parseList(process.env.ADMIN_SUPER_EMAIL),
  ];
  return new Set(emails.map(normalizeEmail));
}

export function getSuperAdminEmail(): string | null {
  const raw = process.env.ADMIN_SUPER_EMAIL?.trim();
  return raw ? normalizeEmail(raw) : null;
}

export function isConfiguredAdminUid(uid: string): boolean {
  return getAdminUidSet().has(uid);
}

export function isConfiguredAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return getAdminEmailSet().has(normalizeEmail(email));
}

export function isConfiguredSuperAdmin(email: string | undefined): boolean {
  const superEmail = getSuperAdminEmail();
  if (!superEmail || !email) return false;
  return normalizeEmail(email) === superEmail;
}

/** Any admin panel access */
export function hasAdminAccess(uid: string, email?: string): boolean {
  return (
    isConfiguredAdminUid(uid) ||
    isConfiguredAdminEmail(email) ||
    isConfiguredSuperAdmin(email)
  );
}

/** Top-tier admin (currently same routes; reserved for future restrictions) */
export function hasSuperAdminAccess(uid: string, email?: string): boolean {
  if (isConfiguredSuperAdmin(email)) return true;
  const superUid = process.env.ADMIN_SUPER_UID?.trim();
  return !!superUid && uid === superUid;
}
