"use client";

import SocietyConnectionsPanel from "@/components/society/SocietyConnectionsPanel";
import SocietyProfileHero from "@/components/society/SocietyProfileHero";
import SocietyRightRail from "@/components/society/SocietyRightRail";
import SocietySelfProfileSection from "@/components/society/SocietySelfProfileSection";

export default function SocietyPage() {
  return (
    <div className="pb-16">
      <SocietyProfileHero />
      <SocietySelfProfileSection />
      <div className="px-4 lg:px-0">
        <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:gap-12">
          <SocietyConnectionsPanel />
          <SocietyRightRail />
        </div>
      </div>
    </div>
  );
}
