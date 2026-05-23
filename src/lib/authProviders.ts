import type { User } from "firebase/auth";

export const OAUTH_PROVIDER_IDS = ["google.com", "apple.com"] as const;

export type SocialProviderKey = "google" | "apple" | "kakao" | "naver";

export function isEmailPasswordUser(
  user: { providerData: { providerId: string }[] } | null
): boolean {
  return !!user?.providerData.some((p) => p.providerId === "password");
}

/** Google·Apple·카카오·네이버 등 이메일 가입 단계를 건너뛰는 사용자 */
export function isOAuthProfileUser(
  user: { providerData: { providerId: string }[] } | null
): boolean {
  if (!user) return false;
  if (isEmailPasswordUser(user) && user.providerData.length === 1) return false;
  if (user.providerData.some((p) => OAUTH_PROVIDER_IDS.includes(p.providerId as (typeof OAUTH_PROVIDER_IDS)[number]))) {
    return true;
  }
  return !isEmailPasswordUser(user);
}

export function getPrimarySocialProvider(user: User | null): SocialProviderKey | null {
  if (!user) return null;
  if (user.providerData.some((p) => p.providerId === "google.com")) return "google";
  if (user.providerData.some((p) => p.providerId === "apple.com")) return "apple";
  if (!isEmailPasswordUser(user)) {
    return "kakao";
  }
  return null;
}

export function isPopupClosedError(err: unknown): boolean {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
}
