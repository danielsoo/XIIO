"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { AppNavIconSvg } from "@/components/layout/AppNavIcon";
import SidebarProfileRow from "@/components/layout/SidebarProfileRow";
import {
  APP_SIDEBAR_WIDTH,
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
  const href = item.requiresAuth && !user ? "/login" : item.href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      data-nav-id={item.id}
      className={`flex items-center gap-2.5 px-2.5 py-3 rounded-lg text-[13px] font-medium transition-colors ${
        active ? "bg-white/[0.08] text-white" : "text-white/50 hover:text-white hover:bg-white/[0.04]"
      }`}
    >
      <AppNavIconSvg icon={item.icon} active={active} />
      <span className="flex-1 truncate">{t(item.labelKey)}</span>
      {item.badgeKey ? (
        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-400">
          {t(item.badgeKey)}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex flex-col h-full">
      <Link href="/" onClick={onNavigate} className="px-4 pt-6 pb-0 block">
        <span className="text-base font-semibold tracking-[0.22em] text-white">XIIO</span>
      </Link>

      <nav className="flex flex-1 flex-col px-2.5 mt-20 min-h-0">
        <div className="flex flex-col gap-0.5">
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.id} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="h-20 shrink-0 border-t border-white/[0.06]" aria-hidden />
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
        className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-40 border-r border-white/[0.06] bg-[#05070A]"
        style={{ width: APP_SIDEBAR_WIDTH }}
      >
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={onNavigate} aria-hidden />
          <aside
            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 border-r border-white/[0.06] bg-[#05070A] flex flex-col"
            style={{ width: APP_SIDEBAR_WIDTH }}
          >
            <SidebarContent onNavigate={onNavigate} />
          </aside>
        </>
      ) : null}
    </>
  );
}
