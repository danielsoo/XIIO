"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useDepositStatus } from "@/hooks/useDepositStatus";
import SubpageHeader from "@/components/layout/SubpageHeader";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";

export default function UploaderVerifyInner() {
  const { user, loading } = useAuth();
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const { depositVerified, depositEnabled, checked, refresh } = useDepositStatus();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (status === "success" && user) {
      void refresh();
    }
  }, [status, user, refresh]);

  const startDeposit = async () => {
    if (!user) return;
    setErr(null);
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/payments/uploader-deposit/session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ region: "AUTO" }),
      });
      const { data, raw } = await readResponseJson<{ url?: string; error?: string; message?: string }>(res);
      if (!res.ok) {
        setErr(formatApiError(t, res.status, { ...data, message: data.message ?? raw.slice(0, 500) }));
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setErr(t("uploader.errorSessionUrl"));
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "uploader.errorRequestFailed" }));
    } finally {
      setBusy(false);
    }
  };

  if (loading || !checked) {
    return (
      <main className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
        <p className="text-xiio-muted">{t("common.loading")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white">{t("uploader.verifyLoginRequired")}</p>
        <Link href="/login" className="text-xiio-accent hover:underline">
          {t("common.login")}
        </Link>
      </main>
    );
  }

  if (depositVerified) {
    return (
      <main className="min-h-screen bg-xiio-bg px-4 pt-6 pb-16">
        <div className="max-w-md mx-auto">
          <SubpageHeader variant="standalone" title={t("uploader.verifyDoneTitle")} backFallbackHref="/" />
          <div className="rounded-2xl border border-white/10 bg-xiio-surface p-8 text-center">
            <p className="text-xiio-muted text-sm mb-6">{t("uploader.verifyDoneBody")}</p>
            <Link
              href="/uploader/upload"
              className="block w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-medium transition"
            >
              {t("uploader.verifyDoneCta")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-xiio-bg px-4 pt-6 pb-16">
      <div className="max-w-md mx-auto">
        <SubpageHeader variant="standalone" title={t("uploader.verifyTitle")} backFallbackHref="/" />
        <div className="rounded-2xl border border-white/10 bg-xiio-surface p-8">
          <p className="text-xiio-muted text-sm mb-6">{t("uploader.verifyBody")}</p>

          {status === "success" && (
            <div className="mb-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-emerald-400 text-sm">
              {t("uploader.verifySuccessHint")}
            </div>
          )}
          {status === "cancel" && (
            <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-amber-400 text-sm">
              {t("uploader.verifyCancelHint")}
            </div>
          )}

          {!depositEnabled && (
            <div className="mb-4 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xiio-muted text-sm">
              {t("uploader.verifyDisabledHint")}
            </div>
          )}

          {err && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-400 text-sm whitespace-pre-wrap break-words">
              {err}
            </div>
          )}

          <button
            type="button"
            disabled={busy || !depositEnabled}
            onClick={() => void startDeposit()}
            className="w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-40 text-white font-medium transition"
          >
            {busy ? t("common.processing") : t("uploader.verifyPay")}
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            className="w-full mt-3 py-2 rounded-lg border border-white/20 text-sm text-white hover:bg-white/5 transition"
          >
            {t("uploader.verifyRefresh")}
          </button>
        </div>
      </div>
    </main>
  );
}
