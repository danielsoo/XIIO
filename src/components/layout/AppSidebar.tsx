"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import ProfileAvatar from "@/components/ProfileAvatar";
import { AppNavIconSvg } from "@/components/layout/AppNavIcon";
import { getUserProfile } from "@/lib/userProfile";
import {
  APP_SIDEBAR_WIDTH,
  PRIMARY_NAV,
  SECONDARY_NAV,
  type AppNavItem,
} from "@/lib/appNav";
import type { UserProfileDoc } from "@/types/user";

type Props = {
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: AppNavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const href = item.requiresAuth && !user ? "/login" : item.href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-white/10 text-white"
          : "text-white/55 hover:text-white hover:bg-white/5"
      }`}
    >
      <AppNavIconSvg icon={item.icon} />
      <span className="flex-1 truncate">{t(item.labelKey)}</span>
      {item.badgeKey ? (
        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
          {t(item.badgeKey)}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);

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

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handle = profile?.handle?.trim() || user?.email?.split("@")[0] || "guest";

  return (
    <div className="flex flex-col h-full">
      <Link href="/" onClick={onNavigate} className="px-3 py-5 mb-2 block">
        <span className="text-xl font-black tracking-[0.2em] text-white">
          X<span className="text-sky-400">II</span>O
        </span>
      </Link>

      <nav className="flex-1 space-y-0.5 px-2">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.id} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
        ))}
        <div className="my-3 border-t border-white/10" />
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.id} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto px-2 pb-4 pt-3 border-t border-white/10 space-y-1">
        {user ? (
          <>
            <div className="flex items-center gap-2.5 px-3 py-2">
              <ProfileAvatar
                profile={{
                  name: profile?.displayName || user.email || "",
                  avatarUrl: profile?.avatarUrl ?? null,
                }}
                size="sm"
              />
              <span className="text-sm text-white/80 truncate">{handle}</span>
            </div>
            <Link
              href="/settings"
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/55 hover:text-white hover:bg-white/5"
            >
              <AppNavIconSvg icon="about" />
              {t("profileMenu.settings")}
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/55 hover:text-white hover:bg-white/5 text-left"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              {t("profileMenu.logout")}
            </button>
          </>
        ) : (
          <Link
            href="/login"
            onClick={onNavigate}
            className="block mx-2 text-center py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold"
          >
            {t("common.login")}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function AppSidebar({ mobileOpen = false, onNavigate }: Props) {
  return (
    <>
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-40 border-r border-white/10 bg-[#05070A]"
        style={{ width: APP_SIDEBAR_WIDTH }}
      >
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60"
            onClick={onNavigate}
            aria-hidden
          />
          <aside
            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 border-r border-white/10 bg-[#05070A] flex flex-col"
            style={{ width: APP_SIDEBAR_WIDTH }}
          >
            <SidebarContent onNavigate={onNavigate} />
          </aside>
        </>
      ) : null}
    </>
  );
}
