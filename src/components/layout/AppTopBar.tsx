"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import ProfileMenu from "@/components/ProfileMenu";

type Props = {
  onMenuOpen: () => void;
};

export default function AppTopBar({ onMenuOpen }: Props) {
  const { t } = useTranslations();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-14 lg:h-16 flex items-center gap-3 px-4 lg:px-8 border-b border-white/5 bg-[#05070A]/80 backdrop-blur-md">
      <button
        type="button"
        className="lg:hidden p-2 -ml-1 text-white/80 hover:text-white"
        onClick={onMenuOpen}
        aria-label={t("nav.menuOpen")}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1 flex justify-center max-w-xl mx-auto">
        <label className="relative w-full hidden sm:block">
          <span className="sr-only">{t("topBar.searchLabel")}</span>
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            type="search"
            readOnly
            placeholder={t("topBar.searchPlaceholder")}
            className="w-full rounded-full bg-white/5 border border-white/10 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/35 cursor-default"
          />
        </label>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition"
          aria-label={t("topBar.notifications")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0"
            />
          </svg>
        </button>
        {user ? (
          <div className="hidden sm:block">
            <ProfileMenu />
          </div>
        ) : (
          <Link
            href="/login"
            className="hidden sm:inline-flex text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium"
          >
            {t("common.login")}
          </Link>
        )}
      </div>
    </header>
  );
}
