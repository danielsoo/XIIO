"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import ProfileAvatar from "@/components/ProfileAvatar";
import { IconBell, IconSearch } from "@/components/icons/MockupIcons";
import { getUserProfile } from "@/lib/userProfile";
import type { UserProfileDoc } from "@/types/user";

type Props = {
  onMenuOpen: () => void;
};

export default function AppTopBar({ onMenuOpen }: Props) {
  const { t } = useTranslations();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
    <header className="sticky top-0 z-30 h-14 lg:h-[60px] flex items-center gap-3 px-4 lg:px-8 bg-[#05070A]/90 backdrop-blur-md">
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

      <div className="flex-1 flex justify-center max-w-2xl mx-auto">
        <label className="relative w-full hidden sm:block">
          <span className="sr-only">{t("topBar.searchLabel")}</span>
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="search"
            readOnly
            placeholder={t("topBar.searchPlaceholder")}
            className="w-full h-10 rounded-full bg-white/[0.04] border border-white/[0.08] py-2 pl-11 pr-4 text-sm text-white placeholder:text-white/30 cursor-default"
          />
        </label>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          className="p-2.5 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition"
          aria-label={t("topBar.notifications")}
        >
          <IconBell />
        </button>

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
              <div className="absolute right-0 top-full mt-2 py-1 w-44 rounded-lg border border-white/10 bg-[#0c0e12] shadow-xl z-50">
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
            className="hidden sm:inline-flex text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium"
          >
            {t("common.login")}
          </Link>
        )}
      </div>
    </header>
  );
}
