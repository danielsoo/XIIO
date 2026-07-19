"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import ProfileAvatar from "@/components/ProfileAvatar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { IconSearch } from "@/components/icons/MockupIcons";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { getUserProfile } from "@/lib/userProfile";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import type { UserProfileDoc } from "@/types/user";

type Props = {
  onMenuOpen: () => void;
};

function MockProfileIcon() {
  return (
    <svg
      className="w-[18px] h-[18px] text-white/60"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

export default function AppTopBar({ onMenuOpen }: Props) {
  const { t } = useTranslations();
  const { user, logout } = useAuth();
  const { isAdmin, checked: adminChecked } = useAdminAccess();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    void getUserProfile(user.uid).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const displayName = profile?.displayName?.trim() || user?.displayName || user?.email || "";

  return (
    <header
      className={`sticky top-0 z-30 flex min-w-0 items-center gap-3 px-4 ${MOCKUP_HOME.topBarRightPad} ${MOCKUP_HOME.topBarHeight} border-b border-white/[0.06] bg-xiio-bg/90 backdrop-blur-md`}
    >
      <button
        type="button"
        className="lg:hidden p-2 -ml-1 text-white/70 hover:text-white"
        onClick={onMenuOpen}
        aria-label={t("nav.menuOpen")}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="min-w-0 flex-1" aria-hidden />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = searchValue.trim();
          router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
        }}
        className={`absolute left-1/2 hidden -translate-x-1/2 sm:block ${MOCKUP_HOME.searchBar}`}
      >
        <label>
          <span className="sr-only">{t("topBar.searchLabel")}</span>
          <IconSearch className={`absolute top-1/2 -translate-y-1/2 ${MOCKUP_HOME.searchIconLeft} w-4 h-4 text-white/30`} />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t("topBar.searchPlaceholder")}
            className="w-full h-full rounded-full bg-white/[0.04] border border-white/[0.08] py-2 pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent/50"
          />
        </label>
      </form>

      <div className="flex items-center gap-1 shrink-0">
        <NotificationBell />

        {user ? (
          <div ref={ref} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1 rounded-full hover:ring-2 hover:ring-white/10 transition"
              aria-label={t("profileMenu.ariaLabel")}
            >
              <ProfileAvatar
                profile={{ name: displayName, avatarUrl: profile?.avatarUrl ?? null }}
                size="sm"
              />
            </button>
            {menuOpen ? (
              <div className="animate-dropdown-in absolute right-0 top-full mt-2 py-1 w-44 rounded-lg border border-white/10 bg-xiio-card shadow-xl z-50">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/account");
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5"
                >
                  {t("profileMenu.accountProfile")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/settings");
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5"
                >
                  {t("profileMenu.settings")}
                </button>
                {adminChecked && isAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/admin");
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5"
                  >
                    {t("profileMenu.adminPanel")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void logout().then(() => router.push("/"))}
                  className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5 border-t border-white/10"
                >
                  {t("profileMenu.logout")}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <Link
            href="/login"
            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 transition"
            aria-label={t("common.login")}
          >
            <MockProfileIcon />
          </Link>
        )}
      </div>
    </header>
  );
}
