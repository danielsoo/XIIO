"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import AppTopBar from "@/components/layout/AppTopBar";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { APP_SIDEBAR_WIDTH, shouldHideAppShell } from "@/lib/appNav";
import { frameShellStyle } from "@/lib/mockupLayout";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { heroStyle } = useHomeHeroTheme();

  if (shouldHideAppShell(pathname)) {
    return <>{children}</>;
  }

  return (
    <div
      className="min-h-screen bg-[#05070A] text-white"
      style={{ ...heroStyle, ...frameShellStyle }}
    >
      <AppSidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <div
        className="lg:pl-[var(--app-sidebar-width)]"
        style={{ ["--app-sidebar-width" as string]: APP_SIDEBAR_WIDTH }}
      >
        <AppTopBar onMenuOpen={() => setMobileOpen(true)} />
        {children}
      </div>
    </div>
  );
}
