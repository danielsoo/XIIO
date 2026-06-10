"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SocietyConnectionsPanel, {
  type SocietyTabId,
} from "@/components/society/SocietyConnectionsPanel";
import SocietyProfileHero from "@/components/society/SocietyProfileHero";
import SocietyRightRail from "@/components/society/SocietyRightRail";

const SOCIETY_TABS: SocietyTabId[] = ["discover", "connections", "requests", "sent", "works"];

function parseSocietyTab(raw: string | null): SocietyTabId {
  if (raw && SOCIETY_TABS.includes(raw as SocietyTabId)) return raw as SocietyTabId;
  return "discover";
}

export default function SocietyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseSocietyTab(searchParams.get("tab"));

  const onTabChange = useCallback(
    (next: SocietyTabId) => {
      router.replace(`/society?tab=${next}`, { scroll: false });
    },
    [router]
  );

  return (
    <div className="pb-16">
      <SocietyProfileHero />
      <div className="px-4 lg:px-0">
        <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:gap-12">
          <SocietyConnectionsPanel activeTab={tab} onTabChange={onTabChange} />
          {tab !== "works" ? <SocietyRightRail /> : null}
        </div>
      </div>
    </div>
  );
}
