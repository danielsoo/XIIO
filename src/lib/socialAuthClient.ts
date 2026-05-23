import type { TranslateFn } from "@/lib/clientErrors";
import { getFirebaseErrorCode } from "@/lib/authErrors";
import { isPopupClosedError, type SocialProviderKey } from "@/lib/authProviders";

const LOGIN_ERROR_KEYS: Record<SocialProviderKey, string> = {
  google: "auth.login.errorGoogleFailed",
  apple: "auth.login.errorAppleFailed",
  kakao: "auth.login.errorKakaoFailed",
  naver: "auth.login.errorNaverFailed",
};

const SIGNUP_ERROR_KEYS: Record<SocialProviderKey, string> = {
  google: "auth.signup.errorGoogleFailed",
  apple: "auth.signup.errorAppleFailed",
  kakao: "auth.signup.errorKakaoFailed",
  naver: "auth.signup.errorNaverFailed",
};

export function formatSocialAuthError(
  err: unknown,
  t: TranslateFn,
  provider: SocialProviderKey,
  mode: "login" | "signup"
): string {
  if (isPopupClosedError(err)) return "";

  const code = getFirebaseErrorCode(err);
  if (code === "auth/account-exists-with-different-credential") {
    return t("auth.login.errorAccountExistsDifferent");
  }

  const message = err instanceof Error ? err.message : "";
  if (message === "KAKAO_NOT_READY") return t("auth.login.errorKakaoNotConfigured");
  if (message === "KAKAO_NOT_CONFIGURED") return t("auth.login.errorKakaoNotConfigured");

  const key = mode === "login" ? LOGIN_ERROR_KEYS[provider] : SIGNUP_ERROR_KEYS[provider];
  return t(key);
}

export function formatAuthCallbackError(code: string | null, t: TranslateFn): string {
  switch (code) {
    case "naver_denied":
      return t("auth.login.errorNaverDenied");
    case "account_exists":
      return t("auth.login.errorAccountExistsDifferent");
    case "admin_not_configured":
      return t("auth.login.errorAdminNotConfigured");
    case "naver_not_configured":
      return t("auth.login.errorNaverNotConfigured");
    default:
      return t("auth.login.errorNaverFailed");
  }
}
