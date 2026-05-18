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
    return { code, message: err.message || code || "알 수 없는 오류" };
  }
  if (typeof err === "string" && err) {
    return { code, message: err };
  }
  return { code, message: code ?? "알 수 없는 오류" };
}

export function formatSignupErrorMessage(err: unknown): string {
  const { code, message } = formatAuthError(err);

  if (code === "auth/email-already-in-use") {
    return "이미 가입된 이메일입니다. 같은 비밀번호로 이어서 진행하거나 로그인하세요.";
  }
  if (code === "auth/weak-password") {
    return "비밀번호가 너무 약합니다. 6자 이상으로 설정해주세요.";
  }
  if (code === "auth/too-many-requests") {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  }
  if (code === "auth/invalid-email") {
    return "올바른 이메일 주소를 입력해주세요.";
  }
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "비밀번호가 올바르지 않습니다.";
  }
  if (code === "permission-denied") {
    return "Firestore 저장 권한이 없습니다. firestore.rules를 xiio DB에 배포했는지 확인하세요.";
  }
  if (code === "not-found" || message.includes("NOT_FOUND")) {
    return "Firestore DB를 찾을 수 없습니다. Vercel에 NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID=xiio 를 설정하세요.";
  }

  const detail = [code, message].filter(Boolean).join(" — ");
  return detail ? `회원가입에 실패했습니다. (${detail})` : "회원가입에 실패했습니다. 다시 시도해주세요.";
}
