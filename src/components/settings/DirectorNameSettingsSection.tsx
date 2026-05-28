"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";
import type { DirectorNameChangeRequest } from "@/types/user";

type UploaderSettingsResponse = {
  defaultDirectorName: string | null;
  directorNameChangeRequest: DirectorNameChangeRequest | null;
};

const inputClass =
  "w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 transition focus:outline-none focus:border-xiio-accent/80 focus:bg-white/[0.06] focus:ring-2 focus:ring-xiio-accent/20";

export default function DirectorNameSettingsSection() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [loading, setLoading] = useState(true);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<DirectorNameChangeRequest | null>(null);
  const [requestedName, setRequestedName] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/me/uploader-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data: body, raw } = await readResponseJson<UploaderSettingsResponse & {
        message?: string;
        error?: string;
      }>(res);
      if (!res.ok) {
        setError(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
      setCurrentName(body.defaultDirectorName);
      const req = body.directorNameChangeRequest;
      setPendingRequest(req?.status === "pending" ? req : null);
    } catch (e) {
      setError(formatClientError(t, e, { titleKey: "settings.directorNameRequestFailed" }));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !currentName) return null;

  const isPending = !!pendingRequest;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isPending) return;
    const trimmed = requestedName.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/me/director-name-change-request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestedName: trimmed,
          reason: reason.trim() || undefined,
        }),
      });
      const { data: body, raw } = await readResponseJson<{
        message?: string;
        error?: string;
        directorNameChangeRequest?: DirectorNameChangeRequest;
      }>(res);
      if (!res.ok) {
        setError(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
      setSuccess(true);
      setRequestedName("");
      setReason("");
      if (body.directorNameChangeRequest?.status === "pending") {
        setPendingRequest(body.directorNameChangeRequest);
      } else {
        await load();
      }
    } catch (err) {
      setError(formatClientError(t, err, { titleKey: "settings.directorNameRequestFailed" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-xiio-surface/90 p-6 md:p-8 shadow-lg shadow-black/25 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 border-b border-white/10 pb-4">
          <h2 className="text-lg font-semibold text-white">{t("settings.directorNameSection")}</h2>
          <p className="mt-1.5 text-sm text-xiio-muted leading-relaxed">{t("settings.directorNameLockedHint")}</p>
        </div>

        <div className="mb-5 pb-3 border-b border-white/8">
          <p className="text-xs font-medium tracking-wide text-xiio-muted/75 mb-1">
            {t("settings.directorNameCurrent")}
          </p>
          <p className="text-base font-semibold text-white/95">{currentName}</p>
        </div>

        {isPending && (
          <div className="mb-4 rounded-xl border border-xiio-accent/30 bg-xiio-accent/10 px-4 py-3 text-sm text-white">
            {t("settings.directorNamePending")}
            <p className="text-xs text-xiio-muted mt-1.5">
              {pendingRequest.requestedName}
              {pendingRequest.reason ? ` — ${pendingRequest.reason}` : ""}
            </p>
          </div>
        )}

        {success && !isPending && (
          <p className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
            {t("settings.directorNameSuccess")}
          </p>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm whitespace-pre-wrap break-words">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void submit(e)} className="space-y-4 pt-1">
          <div className="max-w-xl">
            <label className="block text-xs font-medium text-xiio-muted/90 mb-1.5" htmlFor="director-change-name">
              {t("settings.directorNameRequestLabel")}
            </label>
            <input
              id="director-change-name"
              type="text"
              value={requestedName}
              onChange={(e) => setRequestedName(e.target.value)}
              disabled={busy || isPending}
              className={inputClass}
              maxLength={120}
            />
          </div>
          <div className="max-w-3xl">
            <label className="block text-xs font-medium text-xiio-muted/90 mb-1.5" htmlFor="director-change-reason">
              {t("settings.directorNameReasonLabel")}
            </label>
            <textarea
              id="director-change-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy || isPending}
              placeholder={t("settings.directorNameReasonPlaceholder")}
              className={`${inputClass} min-h-[92px] resize-y`}
              maxLength={500}
            />
          </div>
          <div className="max-w-3xl pt-2">
            <button
              type="submit"
              disabled={busy || isPending || !requestedName.trim()}
              className="w-full py-2.5 rounded-xl bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-40 text-white text-sm font-semibold tracking-[0.01em] transition"
            >
              {busy ? t("settings.directorNameSubmitting") : t("settings.directorNameSubmit")}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
