"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";
import { REPORT_REASON_CODES, type ReportReasonCode, type ReportTargetType } from "@/types/report";

type Props = {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetOwnerUid: string;
  targetWorkId: string;
};

export default function ReportContentModal({
  open,
  onClose,
  targetType,
  targetOwnerUid,
  targetWorkId,
}: Props) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [reasonCode, setReasonCode] = useState<ReportReasonCode>("inappropriate");
  const [reasonDetail, setReasonDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const resetAndClose = () => {
    setDone(false);
    setError(null);
    setReasonCode("inappropriate");
    setReasonDetail("");
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError(t("report.loginRequired"));
      return;
    }
    if (reasonCode === "other" && !reasonDetail.trim()) {
      setError(t("report.detailRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetType,
          targetOwnerUid,
          targetWorkId,
          reasonCode,
          reasonDetail: reasonDetail.trim() || undefined,
        }),
      });
      const { data: body, raw } = await readResponseJson<{ message?: string; error?: string }>(res);
      if (!res.ok) {
        if (res.status === 409) {
          setError(t("report.duplicate"));
        } else {
          setError(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        }
        return;
      }
      setDone(true);
    } catch (e) {
      setError(formatClientError(t, e, { titleKey: "report.error" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-xiio-surface p-6 shadow-xl">
        {done ? (
          <>
            <h2 id="report-modal-title" className="text-lg font-semibold text-white mb-3">
              {t("report.title")}
            </h2>
            <p className="text-sm text-white/85 leading-relaxed mb-6">{t("report.thankYou")}</p>
            <button
              type="button"
              onClick={resetAndClose}
              className="w-full py-2.5 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white text-sm font-medium"
            >
              {t("report.close")}
            </button>
          </>
        ) : (
          <form onSubmit={(e) => void submit(e)}>
            <h2 id="report-modal-title" className="text-lg font-semibold text-white mb-4">
              {t("report.title")}
            </h2>
            <label className="block text-xs text-xiio-muted mb-1">{t("report.reasonLabel")}</label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as ReportReasonCode)}
              disabled={busy}
              className="w-full mb-4 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              {REPORT_REASON_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`report.reason.${code}`)}
                </option>
              ))}
            </select>
            <label className="block text-xs text-xiio-muted mb-1">{t("report.detailLabel")}</label>
            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              disabled={busy}
              rows={3}
              className="w-full mb-4 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-y min-h-[4rem]"
            />
            {error && (
              <p className="text-sm text-red-400 mb-3 whitespace-pre-wrap break-words">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetAndClose}
                disabled={busy}
                className="flex-1 py-2.5 rounded-lg border border-white/20 text-white text-sm hover:bg-white/5 disabled:opacity-40"
              >
                {t("report.cancel")}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 py-2.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-40"
              >
                {busy ? t("admin.loading") : t("report.submit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
