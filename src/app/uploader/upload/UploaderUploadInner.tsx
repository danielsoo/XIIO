"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DirectorNameSetupModal from "@/components/uploader/DirectorNameSetupModal";
import UploaderUploadForm from "@/components/uploader/UploaderUploadForm";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useDepositStatus } from "@/hooks/useDepositStatus";

export default function UploaderUploadInner() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslations();
  const { depositVerified, depositEnabled, checked } = useDepositStatus();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [defaultDirectorName, setDefaultDirectorName] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [showDirectorModal, setShowDirectorModal] = useState(false);

  const needsDeposit = depositEnabled && !depositVerified;

  useEffect(() => {
    if (!user || needsDeposit || authLoading || !checked) {
      setSettingsLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/me/uploader-settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as { defaultDirectorName?: string | null };
        if (cancelled) return;
        const name = data.defaultDirectorName?.trim() || null;
        setDefaultDirectorName(name);
        setShowDirectorModal(!name);
      } catch {
        if (!cancelled) setShowDirectorModal(false);
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, needsDeposit, authLoading, checked]);

  if (authLoading || !checked || settingsLoading) {
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
    <main className="min-h-screen bg-xiio-bg px-4 pt-24 pb-16 md:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">{t("uploader.uploadTitle")}</h1>
          <p className="text-xiio-muted text-sm md:text-base max-w-2xl">{t("uploader.uploadBody")}</p>
        </header>

        {done && (
          <div className="mb-6 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-emerald-400 text-sm">
            {done}
          </div>
        )}
        {err && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm whitespace-pre-wrap break-words">
            {err}
          </div>
        )}

        <DirectorNameSetupModal
          open={showDirectorModal}
          onSaved={(name) => {
            setDefaultDirectorName(name);
            setShowDirectorModal(false);
          }}
        />

        <UploaderUploadForm
          user={user}
          initialDirector={defaultDirectorName}
          onSuccess={(message) => {
            setDone(message);
            setErr(null);
          }}
          onError={(message) => {
            setErr(message);
            setDone(null);
          }}
        />

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
          <Link href="/uploader/works" className="text-xiio-accent hover:underline">
            {t("myWorks.title")}
          </Link>
          <span className="hidden sm:inline text-white/20" aria-hidden>
            |
          </span>
          <Link href="/" className="text-xiio-muted hover:text-white transition">
            {t("common.home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
