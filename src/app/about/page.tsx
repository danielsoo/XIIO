"use client";

import { useTranslations } from "@/context/LocaleContext";

export default function AboutPage() {
  const { t } = useTranslations();

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-10 py-10 pb-16 max-w-3xl">
      <h1 className="text-3xl font-black text-white mb-4">{t("about.title")}</h1>
      <p className="text-white/60 leading-relaxed mb-8">{t("about.lead")}</p>

      <section id="campus" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-3">
        <h2 className="text-lg font-bold text-white">{t("about.campusTitle")}</h2>
        <p className="text-sm text-white/55 leading-relaxed">{t("about.campusBody")}</p>
      </section>
    </main>
  );
}
