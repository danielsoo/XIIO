/** Firebase Auth / Firestore 오류 코드·메시지 추출 */
export function getFirebaseErrorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}

export function formatAuthError(err: unknown): { code?: string; message: string } {
  const code = getFirebaseErrorCode(err);
  if (err instanceof Error) {
    return { code, message: err.message || code || "unknown" };
  }
  if (typeof err === "string" && err) {
    return { code, message: err };
  }
  return { code, message: code ?? "unknown" };
}

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export function formatSignupErrorMessage(err: unknown, t: TranslateFn): string {
  const { code, message } = formatAuthError(err);

  if (code === "auth/email-already-in-use") {
    return t("auth.signup.errorEmailInUse");
  }
  if (code === "auth/weak-password") {
    return t("auth.signup.errorWeakPassword");
  }
  if (code === "auth/too-many-requests") {
    return t("auth.signup.errorTooManyRequests");
  }
  if (code === "auth/invalid-email") {
    return t("auth.signup.errorEmailInvalid");
  }
  if (code === "permission-denied") {
    return t("auth.signup.errorFirestoreRules");
  }
  if (code === "not-found" || message.includes("NOT_FOUND")) {
    return t("auth.signup.errorFirebaseNotConfigured");
  }

  const detail = [code, message].filter(Boolean).join(" — ");
  return detail
    ? t("auth.signup.errorSignupFailedDetail", { detail })
    : t("auth.signup.errorSignupFailed");
}
