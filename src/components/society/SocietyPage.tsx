"use client";

import SocietyConnectionsPanel from "@/components/society/SocietyConnectionsPanel";
import SocietyRightRail from "@/components/society/SocietyRightRail";

export default function SocietyPage() {
  return (
    <div className="px-4 pb-16 pt-6 lg:px-0">
      <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:gap-12">
        <SocietyConnectionsPanel />
        <SocietyRightRail />
      </div>
    </div>
  );
}
