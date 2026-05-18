"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { isAdmin, isSuperAdmin, checked, reason } = useAdminAccess();
  const { t } = useTranslations();

  const nav = useMemo(
    () => [
      { href: "/admin", label: t("admin.navDashboard"), exact: true },
      { href: "/admin/onboarding", label: t("admin.navOnboarding") },
      { href: "/admin/users", label: t("admin.navUsers") },
      { href: "/admin/content", label: t("admin.navContent") },
      { href: "/admin/reports", label: t("admin.navReports") },
      { href: "/admin/payments", label: t("admin.navPayments") },
    ],
    [t]
  );

  if (loading || !checked) {
    return (
      <div className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
        <p className="text-xiio-muted">{t("admin.loading")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-white text-lg">{t("admin.loginRequired")}</p>
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-medium transition"
        >
          {t("common.login")}
        </Link>
        <Link href="/" className="text-sm text-xiio-muted hover:text-white transition">
          {t("common.backToHome")}
        </Link>
      </div>
    );
  }

  if (reason === "admin_sdk_missing") {
    return (
      <div className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4 px-4 max-w-lg mx-auto text-center">
        <p className="text-amber-400 font-medium">{t("admin.sdkMissingTitle")}</p>
        <p className="text-xiio-muted text-sm">{t("admin.sdkMissingBody")}</p>
        <Link href="/" className="text-sm text-xiio-accent hover:underline">
          {t("common.home")}
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-red-400">{t("admin.noPermission")}</p>
        <Link href="/" className="text-sm text-xiio-muted hover:text-white transition">
          {t("common.backToHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-xiio-bg flex flex-col md:flex-row">
      <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-black/40">
        <div className="p-4 border-b border-white/10">
          <Link href="/admin" className="text-lg font-black tracking-widest text-white">
            X<span className="text-xiio-accent">II</span>O
          </Link>
          <p className="text-xs text-xiio-muted mt-1">
            {isSuperAdmin ? t("admin.roleSuper") : t("admin.roleAdmin")}
          </p>
        </div>
        <nav className="p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {nav.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`block px-3 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                  active ? "bg-xiio-accent/20 text-white" : "text-xiio-muted hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-auto border-t border-white/10 hidden md:block">
          <Link href="/" className="text-sm text-xiio-muted hover:text-xiio-accent transition">
            {t("admin.backToSite")}
          </Link>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
    </div>
  );
}
