"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import AppTopBar from "@/components/layout/AppTopBar";
import { HeroWaveLayoutProvider } from "@/context/HeroWaveLayoutContext";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { APP_SIDEBAR_WIDTH, shouldHideAppShell } from "@/lib/appNav";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { heroStyle } = useHomeHeroTheme();

  if (shouldHideAppShell(pathname)) {
    return <>{children}</>;
  }

  return (
    <HeroWaveLayoutProvider>
      <div className="min-h-screen bg-[#05070A] text-white" style={heroStyle}>
        <AppSidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
        <div
          className={`lg:pl-[var(--app-sidebar-width)] ${MOCKUP_HOME.contentLeftPad} ${MOCKUP_HOME.contentRightPad}`}
          style={{ ["--app-sidebar-width" as string]: APP_SIDEBAR_WIDTH }}
        >
          <AppTopBar onMenuOpen={() => setMobileOpen(true)} />
          {children}
        </div>
      </div>
    </HeroWaveLayoutProvider>
  );
}
