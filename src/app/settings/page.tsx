"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { useTranslations } from "@/context/LocaleContext";
import { LOCALES, type Locale } from "@/i18n";
import type { XiioTimezoneId } from "@/lib/timezone";

const TIMEZONE_OPTIONS: { id: XiioTimezoneId; labelKey: string }[] = [
  { id: "auto", labelKey: "settings.timezoneAuto" },
  { id: "korea", labelKey: "settings.timezoneKorea" },
  { id: "us_eastern", labelKey: "settings.timezoneUsEastern" },
  { id: "us_pacific", labelKey: "settings.timezoneUsPacific" },
  { id: "utc", labelKey: "settings.timezoneUtc" },
];
import ProfileAvatar from "@/components/ProfileAvatar";
import DirectorNameSettingsSection from "@/components/settings/DirectorNameSettingsSection";
import { useAdminAccess } from "@/hooks/useAdminAccess";

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
    <main className="min-h-screen pt-24 pb-16 px-4 bg-xiio-bg">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">{t("settings.title")}</h1>

        <section className="bg-xiio-surface rounded-2xl p-6 border border-white/10 mb-6">
          <h2 className="text-sm font-semibold text-xiio-muted mb-2">{t("settings.language")}</h2>
          <p className="text-xs text-xiio-muted mb-4">{t("settings.languageHint")}</p>
          <div className="flex gap-2">
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code as Locale)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition border ${
                  locale === code
                    ? "bg-xiio-accent border-xiio-accent text-white"
                    : "border-white/20 text-xiio-muted hover:text-white hover:border-white/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {adminChecked && isAdmin && (
          <section className="bg-xiio-surface rounded-2xl p-6 border border-white/10 mb-6">
            <h2 className="text-sm font-semibold text-xiio-muted mb-2">{t("settings.timezone")}</h2>
            <p className="text-xs text-xiio-muted mb-4">{t("settings.timezoneHint")}</p>
            <div className="flex flex-col gap-2">
              {TIMEZONE_OPTIONS.map(({ id, labelKey }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTimezone(id)}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium text-left transition border ${
                    timezone === id
                      ? "bg-xiio-accent border-xiio-accent text-white"
                      : "border-white/20 text-xiio-muted hover:text-white hover:border-white/40"
                  }`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </section>
        )}

        <DirectorNameSettingsSection />

        {activeProfile && (
          <section className="bg-xiio-surface rounded-2xl p-6 border border-white/10 mb-6">
            <h2 className="text-sm font-semibold text-xiio-muted mb-4">{t("settings.watchProfileSection")}</h2>
            <div className="flex items-center gap-4">
              <ProfileAvatar profile={activeProfile} size="lg" />
              <div>
                <p className="text-white font-medium">{activeProfile.name}</p>
                <Link href="/profiles" className="text-sm text-xiio-accent hover:underline mt-1 inline-block">
                  {t("settings.changeProfile")}
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="bg-xiio-surface rounded-2xl p-6 border border-white/10 mb-6">
          <h2 className="text-sm font-semibold text-xiio-muted mb-4">{t("settings.accountSection")}</h2>
          <Link
            href="/account"
            className="text-sm text-xiio-accent hover:underline"
          >
            {t("settings.viewAccountProfile")}
          </Link>
        </section>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="w-full py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition"
        >
          {t("settings.logout")}
        </button>
      </div>
    </main>
  );
}
