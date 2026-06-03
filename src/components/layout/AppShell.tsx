"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import AppTopBar from "@/components/layout/AppTopBar";
import { HeroWaveLayoutProvider } from "@/context/HeroWaveLayoutContext";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { APP_SIDEBAR_WIDTH, shouldHideAppShell } from "@/lib/appNav";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import {
  APP_CONTENT_BOUNDARY_INSET_PX,
  APP_CONTENT_RIGHT_MARGIN_PX,
} from "@/lib/mockupLayout";

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
          className={`${MOCKUP_HOME.contentMainColumnPad} ${MOCKUP_HOME.contentRightMargin} ${MOCKUP_HOME.contentColumnGuard}`}
          style={{
            ["--app-sidebar-width" as string]: APP_SIDEBAR_WIDTH,
            ["--app-content-boundary-inset" as string]: `${APP_CONTENT_BOUNDARY_INSET_PX}px`,
            ["--app-content-right-margin" as string]: `${APP_CONTENT_RIGHT_MARGIN_PX}px`,
          }}
        >
          <AppTopBar onMenuOpen={() => setMobileOpen(true)} />
          {children}
        </div>
      </div>
    </HeroWaveLayoutProvider>
  );
}
