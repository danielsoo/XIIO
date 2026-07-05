"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import AppTopBar from "@/components/layout/AppTopBar";
import { DmUnreadProvider } from "@/context/DmUnreadContext";
import { HeroWaveLayoutProvider } from "@/context/HeroWaveLayoutContext";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { APP_SIDEBAR_WIDTH, shouldHideAppShell } from "@/lib/appNav";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import { APP_CONTENT_BOUNDARY_INSET_PX } from "@/lib/mockupLayout";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { heroStyle } = useHomeHeroTheme();

  if (shouldHideAppShell(pathname)) {
    return <>{children}</>;
  }

  return (
    <HeroWaveLayoutProvider>
      <DmUnreadProvider>
        <div className="min-h-screen min-w-[360px] bg-xiio-bg text-white" style={heroStyle}>
          <AppSidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
          <div
            className={`${MOCKUP_HOME.contentMainColumnPad} ${MOCKUP_HOME.contentColumnGuard} transition-[padding] duration-300 ease-in-out`}
            style={{
              ["--app-sidebar-width" as string]: APP_SIDEBAR_WIDTH,
              ["--app-content-boundary-inset" as string]: `${APP_CONTENT_BOUNDARY_INSET_PX}px`,
            }}
          >
            <AppTopBar onMenuOpen={() => setMobileOpen(true)} />
            {children}
          </div>
        </div>
      </DmUnreadProvider>
    </HeroWaveLayoutProvider>
  );
}
