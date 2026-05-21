"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";

type Props = {
  open: boolean;
  onSaved: (name: string) => void;
};

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent";

export default function DirectorNameSetupModal({ open, onSaved }: Props) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("uploader.directorModalRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/me/uploader-settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ defaultDirectorName: trimmed }),
      });
      const { data: body, raw } = await readResponseJson<{
        defaultDirectorName?: string;
        message?: string;
        error?: string;
      }>(res);
      if (!res.ok) {
        setError(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
      onSaved(body.defaultDirectorName ?? trimmed);
    } catch (err) {
      setError(formatClientError(t, err, { titleKey: "uploader.directorModalSaveFailed" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="director-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-xiio-surface p-6 shadow-xl">
        <h2 id="director-modal-title" className="text-xl font-bold text-white mb-2">
          {t("uploader.directorModalTitle")}
        </h2>
        <p className="text-sm text-xiio-muted mb-6 leading-relaxed">{t("uploader.directorModalBody")}</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-400 text-sm whitespace-pre-wrap break-words">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div>
            <label className="block text-xs text-xiio-muted mb-1.5" htmlFor="director-modal-name">
              {t("uploader.uploadDirectorLabel")}
            </label>
            <input
              id="director-modal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("uploader.uploadDirectorPlaceholder")}
              disabled={busy}
              className={inputClass}
              autoFocus
              maxLength={120}
            />
          </div>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-40 text-white font-medium transition"
          >
            {busy ? t("common.saving") : t("uploader.directorModalConfirm")}
          </button>
        </form>
      </div>
    </div>
  );
}
