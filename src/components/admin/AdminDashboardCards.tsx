"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "@/context/LocaleContext";
import { useAdminWorkStats } from "@/hooks/useAdminWorkStats";

export default function AdminDashboardCards() {
  const { t } = useTranslations();
  const { stats } = useAdminWorkStats(true);

  const cards = useMemo(
    () => [
      {
        href: "/admin/onboarding",
        title: t("admin.cardOnboardingTitle"),
        description: t("admin.cardOnboardingDesc"),
        ready: true,
      },
      {
        href: "/admin/users",
        title: t("admin.cardUsersTitle"),
        description: t("admin.cardUsersDesc"),
        ready: true,
      },
      {
        href: "/admin/content",
        title: t("admin.cardContentTitle"),
        description: t("admin.cardContentDesc"),
        ready: true,
        badge:
          stats != null
            ? stats.pendingFull + stats.pendingPromo + stats.removalRequested
            : undefined,
      },
      {
        href: "/admin/reports",
        title: t("admin.cardReportsTitle"),
        description: t("admin.cardReportsDesc"),
        ready: false,
      },
      {
        href: "/admin/payments",
        title: t("admin.cardPaymentsTitle"),
        description: t("admin.cardPaymentsDesc"),
        ready: false,
      },
    ],
    [t, stats]
  );

  return (
    <>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{t("admin.dashboardTitle")}</h1>
      <p className="text-xiio-muted text-sm mb-8">{t("admin.dashboardSubtitle")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`block rounded-2xl border p-6 transition shadow-lg ${
              card.ready
                ? "border-white/10 bg-xiio-surface hover:border-xiio-accent/40"
                : "border-dashed border-white/15 bg-white/[0.02] hover:border-white/25"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="text-lg font-bold text-white">{card.title}</h2>
              {"badge" in card && card.badge != null && card.badge > 0 && (
                <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center">
                  {card.badge > 99 ? "99+" : card.badge}
                </span>
              )}
            </div>
            <p className="text-xiio-muted text-sm mb-4">{card.description}</p>
            <span className="text-xiio-accent text-sm font-medium">{t("common.open")}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
