"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import ProProfileEditor from "@/components/profile/ProProfileEditor";
import PortfolioShareSection from "@/components/settings/PortfolioShareSection";

const sectionClass =
  "rounded-2xl border border-white/10 bg-xiio-surface/90 p-6 shadow-lg shadow-black/25";

export default function AccountProfileEditPage() {
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
        title={t("profile.edit.pageTitle")}
        description={t("profile.edit.pageLead")}
        backFallbackHref="/account"
      />

      <div className="space-y-6 max-w-3xl">
        <section className={sectionClass}>
          <ProProfileEditor />
        </section>
        <section className={sectionClass} id="portfolio">
          <PortfolioShareSection />
        </section>
      </div>
    </AppPageShell>
  );
}
