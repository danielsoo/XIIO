"use client";

import { useDmInbox } from "@/components/messages/DmInboxContext";
import type { DmInboxTab } from "@/components/messages/types";
import { useTranslations } from "@/context/LocaleContext";

const TABS: DmInboxTab[] = ["primary", "general", "requests"];

export default function DmInboxTabs() {
  const { tab, setTab } = useDmInbox();
  const { t } = useTranslations();

  const labels: Record<DmInboxTab, string> = {
    primary: t("dm.tabs.primary"),
    general: t("dm.tabs.general"),
    requests: t("dm.tabs.requests"),
  };

  return (
    <div className="flex border-b border-white/10 px-2">
      {TABS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setTab(id)}
          className={`flex-1 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
            tab === id
              ? "text-white border-white"
              : "text-xiio-muted border-transparent hover:text-white"
          }`}
        >
          {labels[id]}
        </button>
      ))}
    </div>
  );
}
