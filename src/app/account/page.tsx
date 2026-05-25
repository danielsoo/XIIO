"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import AccountProfileContent from "@/components/account/AccountProfileContent";

function AccountProfileFallback() {
  const { t } = useTranslations();
  return <p className="text-xiio-muted py-8 text-center">{t("common.loading")}</p>;
}

export default function AccountPage() {
  const { user } = useAuth();
  const { t } = useTranslations();

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-xiio-bg text-xiio-muted">
        <Link href="/login" className="text-xiio-accent hover:underline">
          {t("common.loginRequired")}
        </Link>
      </main>
    );
  }

  return (
    <AppPageShell>
      <SubpageHeader
        title={t("accountProfile.title")}
        description={t("accountProfile.subtitle")}
        backFallbackHref="/"
      />
      <Suspense fallback={<AccountProfileFallback />}>
        <AccountProfileContent />
      </Suspense>
    </AppPageShell>
  );
}
