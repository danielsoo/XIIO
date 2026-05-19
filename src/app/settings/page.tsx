"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { useTranslations } from "@/context/LocaleContext";
import { LOCALES, type Locale } from "@/i18n";
import ProfileAvatar from "@/components/ProfileAvatar";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { activeProfile } = useProfile();
  const { t, locale, setLocale } = useTranslations();
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
          <p className="text-sm text-white mb-1">{user.email}</p>
          <p className="text-xs text-xiio-muted">
            {user.emailVerified ? t("settings.emailVerified") : t("settings.emailNotVerified")}
          </p>
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
