"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { LOCALES, type Locale } from "@/i18n";
import type { XiioTimezoneId } from "@/lib/timezone";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { getUserProfile } from "@/lib/userProfile";
import type { UserProfileDoc } from "@/types/user";
import AccountDeleteDialog from "@/components/settings/AccountDeleteDialog";
import DirectorNameSettingsSection from "@/components/settings/DirectorNameSettingsSection";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const TIMEZONE_OPTIONS: { id: XiioTimezoneId; labelKey: string }[] = [
  { id: "auto", labelKey: "settings.timezoneAuto" },
  { id: "korea", labelKey: "settings.timezoneKorea" },
  { id: "us_eastern", labelKey: "settings.timezoneUsEastern" },
  { id: "us_pacific", labelKey: "settings.timezoneUsPacific" },
  { id: "utc", labelKey: "settings.timezoneUtc" },
];

const card =
  "h-full rounded-2xl border border-white/10 bg-xiio-surface/90 p-6 shadow-lg shadow-black/25 backdrop-blur-sm";

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-white mb-1">{children}</h2>;
}

function CardHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-xiio-muted mb-4 leading-relaxed">{children}</p>;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { isAdmin, checked: adminChecked } = useAdminAccess();
  const { t, locale, setLocale, timezone, setTimezone } = useTranslations();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [accountProfile, setAccountProfile] = useState<UserProfileDoc | null>(null);

  useEffect(() => {
    if (!user) {
      setAccountProfile(null);
      return;
    }
    let cancelled = false;
    void getUserProfile(user.uid).then((profile) => {
      if (!cancelled) setAccountProfile(profile);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

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
      <section className="relative mb-8 md:mb-10 overflow-hidden rounded-2xl border border-white/10">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#1a0533]/90 via-[#0a0a20]/70 to-xiio-bg"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-xiio-accent/15 to-transparent" aria-hidden />
        <div className="relative px-6 py-8 md:px-8 md:py-10">
          <SubpageHeader
            className="mb-0"
            title={t("settings.title")}
            description={t("settings.pageLead")}
            backFallbackHref="/"
          />
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <section className={card}>
          <CardTitle>{t("settings.language")}</CardTitle>
          <CardHint>{t("settings.languageHint")}</CardHint>
          <div className="flex gap-2">
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code as Locale)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border ${
                  locale === code
                    ? "bg-xiio-accent border-xiio-accent text-white shadow-md shadow-xiio-accent/30"
                    : "border-white/15 text-xiio-muted hover:text-white hover:border-white/30 hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {adminChecked && isAdmin && (
          <section className={card}>
            <CardTitle>{t("settings.timezone")}</CardTitle>
            <CardHint>{t("settings.timezoneHint")}</CardHint>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {TIMEZONE_OPTIONS.map(({ id, labelKey }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTimezone(id)}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium text-left transition border ${
                    timezone === id
                      ? "bg-xiio-accent border-xiio-accent text-white"
                      : "border-white/15 text-xiio-muted hover:text-white hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </section>
        )}

        {accountProfile && (
          <section className={card}>
            <CardTitle>{t("settings.accountSection")}</CardTitle>
            <div className="flex items-center gap-4 mt-4">
              <ProfileAvatar
                displayName={accountProfile.displayName || "?"}
                avatarUrl={accountProfile.avatarUrl}
                className="w-16 h-16 rounded-full bg-xiio-accent/20 ring-2 ring-xiio-accent/40 flex items-center justify-center text-xl font-bold text-white overflow-hidden shrink-0"
                imgClassName="w-full h-full object-cover"
              />
              <div className="min-w-0">
                <p className="text-lg font-medium text-white truncate">
                  {accountProfile.displayName || "—"}
                </p>
                <Link
                  href="/account"
                  className="inline-block mt-2 text-sm font-medium text-xiio-accent hover:underline"
                >
                  {t("settings.viewAccountProfile")}
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="mt-8">
        <DirectorNameSettingsSection />
      </div>

      <div className="mt-10 pt-6 border-t border-white/10 space-y-4">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-red-400 border border-red-400/70 hover:bg-red-500/10 hover:border-red-400 hover:text-red-300 transition"
        >
          {t("settings.logout")}
        </button>
        <p className="text-xs text-xiio-muted">
          {t("settings.deleteAccount.hint")}{" "}
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="text-xiio-muted/80 underline underline-offset-2 hover:text-xiio-accent transition"
          >
            {t("settings.deleteAccount.link")}
          </button>
        </p>
      </div>

      <AccountDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onSuccess={async () => {
          setDeleteOpen(false);
          await logout();
          router.push("/");
        }}
      />
    </AppPageShell>
  );
}
