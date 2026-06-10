"use client";

import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import { useTranslations } from "@/context/LocaleContext";

export default function AboutPage() {
  const { t } = useTranslations();

  return (
    <AppPageShell>
      <SubpageHeader title={t("about.title")} description={t("about.lead")} backFallbackHref="/" />

      <div className="max-w-3xl">
        <section id="campus" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-3">
          <h2 className="text-lg font-bold text-white">{t("about.campusTitle")}</h2>
          <p className="text-sm text-white/55 leading-relaxed">{t("about.campusBody")}</p>
        </section>
      </div>
    </AppPageShell>
  );
}
