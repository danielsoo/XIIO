/** Node 테스트용 — 외부 import 없음 */

export type CreditDisplayProfilePure = {
  displayName: string;
  defaultDirectorName?: string | null;
  handle?: string | null;
};

const MAX_LEN = 120;

export function resolveWorkCreditDisplayNamePure(
  profile: CreditDisplayProfilePure,
  role: string
): string {
  if (role === "director") {
    const director = profile.defaultDirectorName?.trim();
    if (director) return director.slice(0, MAX_LEN);
  }
  const display = profile.displayName?.trim();
  if (display) return display.slice(0, MAX_LEN);
  const handle = profile.handle?.trim();
  if (handle) return handle.slice(0, MAX_LEN);
  return "";
}

export function creditDisplayNameMapKey(userId: string, role: string): string {
  return `${userId}:${role}`;
}
