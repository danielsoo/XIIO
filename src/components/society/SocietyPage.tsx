"use client";

import { useState } from "react";
import SocietyConnectionsPanel, {
  type SocietyTabId,
} from "@/components/society/SocietyConnectionsPanel";
import SocietyProfileHero from "@/components/society/SocietyProfileHero";
import SocietyRightRail from "@/components/society/SocietyRightRail";

export default function SocietyPage() {
  const [tab, setTab] = useState<SocietyTabId>("discover");

  return (
    <div className="pb-16">
      <SocietyProfileHero />
      <div className="px-4 lg:px-0">
        <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:gap-12">
          <SocietyConnectionsPanel activeTab={tab} onTabChange={setTab} />
          {tab !== "works" ? <SocietyRightRail /> : null}
        </div>
      </div>
    </div>
  );
}
