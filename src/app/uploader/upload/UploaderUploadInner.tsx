"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import DirectorNameSetupModal from "@/components/uploader/DirectorNameSetupModal";
import UploaderUploadForm from "@/components/uploader/UploaderUploadForm";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useDepositStatus } from "@/hooks/useDepositStatus";

export default function UploaderUploadInner() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslations();
  const { depositVerified, depositEnabled, checked } = useDepositStatus();
  const [err, setErr] = useState<string | null>(null);
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
      <AppPageShell standalone>
        <SubpageHeader variant="standalone" backFallbackHref="/" />
        <div className="max-w-lg mx-auto rounded-2xl border border-white/10 bg-xiio-surface p-8">
          <h1 className="text-2xl font-bold text-white mb-2">{t("uploader.uploadDepositTitle")}</h1>
          <p className="text-xiio-muted text-sm mb-6">{t("uploader.uploadDepositBody")}</p>
          <Link
            href="/uploader/verify"
            className="block w-full text-center py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-medium transition"
          >
            {t("uploader.uploadDepositCta")}
          </Link>
        </div>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell standalone>
        <SubpageHeader
          variant="standalone"
          title={t("uploader.uploadTitle")}
          backFallbackHref="/"
          endContent={
            <Link
              href="/uploader/works"
              className="hidden sm:inline-flex items-center min-h-[44px] px-3 py-2 text-sm font-medium text-xiio-accent hover:underline"
            >
              {t("myWorks.title")}
            </Link>
          }
        />
        <p className="text-xiio-muted text-sm md:text-base max-w-2xl mb-8 -mt-4">{t("uploader.uploadBody")}</p>

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
          onSuccess={({ workId }) => {
            setErr(null);
            router.push(`/uploader/works/${workId}/promo?uploaded=1`);
          }}
          onError={(message) => {
            setErr(message);
          }}
        />

        <p className="mt-6 text-center sm:hidden">
          <Link href="/uploader/works" className="text-base font-medium text-xiio-accent hover:underline">
            {t("myWorks.title")}
          </Link>
        </p>
    </AppPageShell>
  );
}
