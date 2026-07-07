"use client";

import { useDmInbox } from "@/components/messages/DmInboxContext";
import type { DmMainTab } from "@/components/messages/types";
import { useTranslations } from "@/context/LocaleContext";

const TABS: DmMainTab[] = ["messages", "groups", "requests", "invites"];

export default function DmInboxTabs() {
  const { mainTab, setMainTab } = useDmInbox();
  const { t } = useTranslations();

  const labels: Record<DmMainTab, string> = {
    messages: t("dm.tabs.messages"),
    groups: t("dm.tabs.groups"),
    requests: t("dm.tabs.requests"),
    invites: t("dm.tabs.invites"),
  };

  return (
    <div className="flex border-b border-white/10 px-2">
      {TABS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setMainTab(id)}
          className={`flex-1 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
            mainTab === id
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
