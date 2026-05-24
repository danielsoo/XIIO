"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import SubpageHeader from "@/components/layout/SubpageHeader";
import AccountProfileContent from "@/components/account/AccountProfileContent";

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
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 bg-xiio-bg">
      <div className="max-w-2xl mx-auto">
        <SubpageHeader title={t("accountProfile.title")} backFallbackHref="/" />
        <p className="text-sm text-xiio-muted mb-6 -mt-2">{t("accountProfile.subtitle")}</p>
        <AccountProfileContent />
      </div>
    </main>
  );
}
