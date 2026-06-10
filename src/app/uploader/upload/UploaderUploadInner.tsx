"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const topErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!err) return;
    topErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [err]);
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
      <AppPageShell>
        <p className="text-xiio-muted py-16 text-center">{t("common.loading")}</p>
      </AppPageShell>
    );
  }

  if (!user) {
    return (
      <AppPageShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-white">{t("uploader.uploadLoginRequired")}</p>
          <Link href="/login" className="text-xiio-accent hover:underline">
            {t("common.login")}
          </Link>
        </div>
      </AppPageShell>
    );
  }

  if (needsDeposit) {
    return (
      <AppPageShell>
        <SubpageHeader
          title={t("uploader.uploadDepositTitle")}
          description={t("uploader.uploadDepositBody")}
          backFallbackHref="/"
        />
        <div className="max-w-lg rounded-2xl border border-white/10 bg-xiio-surface p-8">
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
    <AppPageShell>
      <SubpageHeader
        title={t("uploader.uploadTitle")}
        description={t("uploader.uploadBody")}
        backFallbackHref="/"
      />
      <div className="mb-6 flex justify-end -mt-4">
        <Link
          href="/uploader/works"
          className="text-sm font-medium text-xiio-accent hover:underline"
        >
          {t("myWorks.title")}
        </Link>
      </div>

      {err && (
        <div
          ref={topErrorRef}
          role="alert"
          className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm whitespace-pre-wrap break-words"
        >
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
        onSuccess={() => {
          setErr(null);
          router.replace("/uploader/works?submitted=1");
        }}
        onError={(message) => {
          setErr(message);
        }}
      />
    </AppPageShell>
  );
}
