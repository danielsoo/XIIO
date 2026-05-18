export type UploadApiErrorBody = {
  error?: string;
  message?: string;
  detail?: string;
};

const ERROR_I18N_KEYS: Record<string, string> = {
  stream_not_configured: "uploader.errorStreamNotConfigured",
  stream_api_failed: "uploader.errorStreamApiFailed",
  firestore_write_failed: "uploader.errorFirestoreWriteFailed",
  admin_not_configured: "uploader.errorAdminNotConfigured",
  unauthorized: "uploader.errorUnauthorized",
  deposit_required: "uploader.errorDepositRequired",
  deposit_disabled: "uploader.errorDepositDisabled",
};

export function formatUploadApiError(
  t: (key: string, vars?: Record<string, string | number>) => string,
  status: number,
  body: UploadApiErrorBody
): string {
  const code = body.error?.trim();
  const serverMsg = body.message?.trim();
  const detail = body.detail?.trim();

  if (code && ERROR_I18N_KEYS[code]) {
    const lines = [t(ERROR_I18N_KEYS[code])];
    if (serverMsg && !lines[0].includes(serverMsg)) {
      lines.push(serverMsg);
    }
    if (detail) {
      lines.push(detail);
    }
    return lines.join("\n");
  }

  if (serverMsg) {
    return code ? `${serverMsg} (${code}, HTTP ${status})` : `${serverMsg} (HTTP ${status})`;
  }

  if (code) {
    return t("uploader.errorWithCode", { code: `${code} · HTTP ${status}` });
  }

  return t("uploader.errorWithCode", { code: String(status) });
}
