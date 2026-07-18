"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { AppNavIconSvg } from "@/components/layout/AppNavIcon";
import SidebarProfileRow from "@/components/layout/SidebarProfileRow";
import XiioWordmark from "@/components/layout/XiioWordmark";
import { useDmUnreadCount } from "@/context/DmUnreadContext";
import {
  APP_SIDEBAR_WIDTH,
  NETWORK_NAV,
  PRIMARY_NAV,
  SECONDARY_NAV,
  type AppNavItem,
} from "@/lib/appNav";

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
  const unreadCount = useDmUnreadCount();
  const href = item.requiresAuth && !user ? "/login" : item.href;
  const showUnreadBadge = item.id === "messages" && unreadCount > 0;

  return (
    <Link
      href={href}
      prefetch
      onClick={onNavigate}
      id={item.id === "myList" ? "app-nav-my-list" : undefined}
      data-nav-id={item.id}
      className={`flex w-full items-center gap-2.5 py-3 text-[13px] font-medium transition-colors ${
        active
          ? "pl-4 pr-0 rounded-l-lg rounded-r-none bg-white/[0.08] text-white"
          : "px-2.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.04]"
      }`}
    >
      <AppNavIconSvg icon={item.icon} active={active} />
      <span className="flex-1 truncate">{t(item.labelKey)}</span>
      {showUnreadBadge ? (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-xiio-accent text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : item.badgeKey ? (
        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-xiio-accent/20 text-xiio-accent-hover">
          {t(item.badgeKey)}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslations();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex flex-col h-full">
      <Link
        href="/"
        prefetch
        onClick={onNavigate}
        className="flex justify-center px-4 pt-6 pb-0"
        aria-label={t("common.logoHome")}
      >
        <XiioWordmark />
      </Link>

      <nav className="flex flex-1 flex-col pl-2.5 pr-0 mt-20 min-h-0">
        <div className="flex flex-col gap-0.5">
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.id} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="h-px shrink-0 bg-white/[0.06] my-3.5 mr-2.5" aria-hidden />
        <div className="flex flex-col gap-0.5">
          {NETWORK_NAV.map((item) => (
            <NavLink key={item.id} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="flex-1" aria-hidden />
        <div className="h-px shrink-0 bg-white/[0.06] my-3 mr-2.5" aria-hidden />
        <div className="flex flex-col gap-0.5">
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.id} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="mt-auto pb-5 pt-3 border-t border-white/[0.06]">
        <SidebarProfileRow onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export default function AppSidebar({ mobileOpen = false, onNavigate }: Props) {
  return (
    <>
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-40 border-r border-white/[0.06] bg-xiio-sidebar"
        style={{ width: APP_SIDEBAR_WIDTH }}
      >
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={onNavigate} aria-hidden />
          <aside
            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 border-r border-white/[0.06] bg-xiio-sidebar flex flex-col"
            style={{ width: APP_SIDEBAR_WIDTH }}
          >
            <SidebarContent onNavigate={onNavigate} />
          </aside>
        </>
      ) : null}
    </>
  );
}
