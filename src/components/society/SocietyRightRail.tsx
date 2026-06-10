"use client";

import Link from "next/link";
import { useTranslations } from "@/context/LocaleContext";
import { POPULAR_INTERESTS } from "@/lib/societyMockData";

export default function SocietyRightRail() {
  const { t } = useTranslations();

  return (
    <aside className="flex w-full flex-col gap-6 xl:w-[300px] xl:shrink-0">
      <div className="relative overflow-hidden rounded-2xl border border-xiio-accent/25 bg-gradient-to-br from-xiio-accent/25 via-xiio-accent/10 to-transparent p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden
          style={{
            backgroundImage:
              "repeating-linear-gradient( -12deg, transparent, transparent 8px, rgba(255,255,255,0.04) 8px, rgba(255,255,255,0.04) 9px)",
          }}
        />
        <div className="relative">
          <h2 className="text-lg font-semibold leading-snug text-white">
            {t("society.ctaTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{t("society.ctaBody")}</p>
          <Link
            href="/creators"
            prefetch={false}
            className="mt-5 inline-flex rounded-full bg-xiio-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
          >
            {t("society.ctaButton")}
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white">{t("society.popularInterests")}</h3>
        <ul className="mt-4 space-y-3">
          {POPULAR_INTERESTS.map((item) => (
            <li key={item.tag} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-white/75"># {item.tag}</span>
              <span className="shrink-0 text-white/35">{item.count}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/creators"
          prefetch={false}
          className="mt-4 inline-flex items-center gap-1 text-xs text-xiio-accent hover:underline"
        >
          {t("society.viewAllInterests")}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </aside>
  );
}
