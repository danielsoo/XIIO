"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useDepositStatus } from "@/hooks/useDepositStatus";
import { formatUploadApiError, type UploadApiErrorBody } from "@/lib/uploadErrors";
import { WORK_CATEGORIES, type WorkCategory } from "@/types/work";

export default function UploaderUploadInner() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslations();
  const { depositVerified, depositEnabled, checked } = useDepositStatus();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<WorkCategory>("movies");
  const [director, setDirector] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const needsDeposit = depositEnabled && !depositVerified;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const fileInput = (e.target as HTMLFormElement).elements.namedItem("video") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setErr(t("uploader.errorNoFile"));
      return;
    }

    setErr(null);
    setBusy(true);
    setDone(null);

    try {
      const token = await user.getIdToken();
      const sessionRes = await fetch("/api/stream/upload-url", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title || file.name,
          category,
          director: director || undefined,
          description: description || undefined,
        }),
      });
      const sessionData = (await sessionRes.json().catch(() => ({}))) as UploadApiErrorBody;
      if (!sessionRes.ok) {
        setErr(formatUploadApiError(t, sessionRes.status, sessionData));
        return;
      }

      const uploadURL = (sessionData as { uploadURL?: string }).uploadURL;
      if (!uploadURL) {
        setErr(t("uploader.errorNoUploadUrl"));
        return;
      }

      const form = new FormData();
      form.append("file", file);

      const uploadRes = await fetch(uploadURL, { method: "POST", body: form });
      if (!uploadRes.ok) {
        const streamBody = await uploadRes.text().catch(() => "");
        setErr(
          streamBody
            ? `${t("uploader.errorStreamFailed")} (HTTP ${uploadRes.status}): ${streamBody.slice(0, 300)}`
            : `${t("uploader.errorStreamFailed")} (HTTP ${uploadRes.status})`
        );
        return;
      }

      setDone(t("uploader.uploadSuccess"));
      setTitle("");
      setDirector("");
      setDescription("");
      fileInput.value = "";
    } catch {
      setErr(t("uploader.errorUploadFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || !checked) {
    return (
      <main className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
        <p className="text-xiio-muted">{t("common.loading")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white">{t("uploader.uploadLoginRequired")}</p>
        <Link href="/login" className="text-xiio-accent hover:underline">
          {t("common.login")}
        </Link>
      </main>
    );
  }

  if (needsDeposit) {
    return (
      <main className="min-h-screen bg-xiio-bg flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-xiio-surface p-8">
          <h1 className="text-2xl font-bold text-white mb-2">{t("uploader.uploadDepositTitle")}</h1>
          <p className="text-xiio-muted text-sm mb-6">{t("uploader.uploadDepositBody")}</p>
          <Link
            href="/uploader/verify"
            className="block w-full text-center py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-medium transition"
          >
            {t("uploader.uploadDepositCta")}
          </Link>
          <Link href="/" className="block text-center text-sm text-xiio-muted hover:text-white mt-6 transition">
            {t("common.home")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-xiio-bg flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-xiio-surface p-8">
        <h1 className="text-2xl font-bold text-white mb-2">{t("uploader.uploadTitle")}</h1>
        <p className="text-xiio-muted text-sm mb-6">{t("uploader.uploadBody")}</p>

        {done && (
          <div className="mb-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-emerald-400 text-sm">
            {done}
          </div>
        )}
        {err && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-400 text-sm whitespace-pre-wrap break-words">
            {err}
          </div>
        )}

        <form onSubmit={(e) => void handleUpload(e)} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-xiio-muted mb-1.5">{t("uploader.uploadCategoryLabel")}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WorkCategory)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-xiio-accent"
            >
              {WORK_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-xiio-surface">
                  {t(`myWorks.category.${c}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-xiio-muted mb-1.5">{t("uploader.uploadTitleLabel")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("uploader.uploadTitlePlaceholder")}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-xiio-muted mb-1.5">{t("uploader.uploadDirectorLabel")}</label>
            <input
              type="text"
              value={director}
              onChange={(e) => setDirector(e.target.value)}
              placeholder={t("uploader.uploadDirectorPlaceholder")}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-xiio-muted mb-1.5">{t("uploader.uploadDescriptionLabel")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={t("uploader.uploadDescriptionPlaceholder")}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-xiio-muted mb-1.5">{t("uploader.uploadFileLabel")}</label>
            <input
              name="video"
              type="file"
              accept="video/*"
              required
              className="w-full text-sm text-xiio-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-xiio-accent file:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-40 text-white font-medium transition"
          >
            {busy ? t("uploader.uploadSubmitting") : t("uploader.uploadSubmit")}
          </button>
        </form>

        <Link
          href="/uploader/works"
          className="block text-center text-sm text-xiio-accent hover:underline mt-4"
        >
          {t("myWorks.title")}
        </Link>
        <Link href="/" className="block text-center text-sm text-xiio-muted hover:text-white mt-2 transition">
          {t("common.home")}
        </Link>
      </div>
    </main>
  );
}
