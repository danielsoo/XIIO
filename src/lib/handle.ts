const HANDLE_MIN = 3;
const HANDLE_MAX = 30;
const HANDLE_CHARS_REGEX = /^[a-z0-9_.]+$/;

/** 입력 중 허용 문자만 남김 (영문·숫자·_·.) */
export function sanitizeHandleInput(raw: string): string {
  return raw.replace(/^@/, "").replace(/[^a-zA-Z0-9_.]/g, "");
}

/** 인스타그램 스타일 handle 정규화 — 실패 시 null */
export function normalizeHandle(raw: string): string | null {
  const h = raw.trim().toLowerCase().replace(/^@/, "");
  if (h.length < HANDLE_MIN || h.length > HANDLE_MAX) return null;
  if (!HANDLE_CHARS_REGEX.test(h)) return null;
  if (h.startsWith(".") || h.endsWith(".")) return null;
  if (h.includes("..")) return null;
  return h;
}

export type HandleErrorCode = "handle_invalid" | "handle_taken" | "handle_locked";

export function mapHandleApiError(code: string | undefined): HandleErrorCode | null {
  if (code === "handle_invalid" || code === "handle_taken" || code === "handle_locked") {
    return code;
  }
  return null;
}

type TranslateFn = (key: string) => string;

/** 저장 전 클라이언트 검증 — 유효하면 null */
export function getHandleValidationError(raw: string, t: TranslateFn): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (normalizeHandle(trimmed)) return null;
  return t("profile.edit.handleInvalid");
}

export function getHandleErrorMessage(code: HandleErrorCode, t: TranslateFn): string {
  switch (code) {
    case "handle_taken":
      return t("profile.edit.handleTaken");
    case "handle_locked":
      return t("profile.edit.handleLocked");
    default:
      return t("profile.edit.handleInvalid");
  }
}
