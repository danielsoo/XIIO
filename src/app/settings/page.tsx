"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { useTranslations } from "@/context/LocaleContext";
import { LOCALES, type Locale } from "@/i18n";
import type { XiioTimezoneId } from "@/lib/timezone";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import ProfileAvatar from "@/components/ProfileAvatar";
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
  const { activeProfile } = useProfile();
  const { isAdmin, checked: adminChecked } = useAdminAccess();
  const { t, locale, setLocale, timezone, setTimezone } = useTranslations();
  const router = useRouter();

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

        {activeProfile && (
          <section className={card}>
            <CardTitle>{t("settings.watchProfileSection")}</CardTitle>
            <div className="flex items-center gap-4 mt-4">
              <ProfileAvatar profile={activeProfile} size="lg" />
              <div className="min-w-0">
                <p className="text-lg font-medium text-white truncate">{activeProfile.name}</p>
                <Link
                  href="/profiles"
                  className="inline-block mt-2 text-sm font-medium text-xiio-accent hover:underline"
                >
                  {t("settings.changeProfile")}
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className={card}>
          <CardTitle>{t("settings.accountSection")}</CardTitle>
          <Link
            href="/account"
            className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-medium text-white hover:border-xiio-accent/40 hover:bg-xiio-accent/10 transition group"
          >
            <span>{t("settings.viewAccountProfile")}</span>
            <span
              className="text-xiio-muted group-hover:text-xiio-accent transition shrink-0"
              aria-hidden
            >
              →
            </span>
          </Link>
          <Link
            href="/account/profile"
            className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-xiio-accent/30 bg-xiio-accent/10 px-4 py-3.5 text-sm font-medium text-white hover:border-xiio-accent/50 transition group"
          >
            <span>{t("settings.editProProfile")}</span>
            <span
              className="text-xiio-muted group-hover:text-xiio-accent transition shrink-0"
              aria-hidden
            >
              →
            </span>
          </Link>
        </section>
      </div>

      <div className="mt-8">
        <DirectorNameSettingsSection />
      </div>

      <div className="mt-10 pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="text-sm font-medium text-xiio-muted hover:text-red-400 transition"
        >
          {t("settings.logout")}
        </button>
      </div>
    </AppPageShell>
  );
}
