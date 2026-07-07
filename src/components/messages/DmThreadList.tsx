"use client";

import { useDmInbox } from "@/components/messages/DmInboxContext";
import DmThreadListItem from "@/components/messages/DmThreadListItem";
import { useTranslations } from "@/context/LocaleContext";

export default function DmThreadList() {
  const { filteredThreads, loading, mainTab } = useDmInbox();
  const { t } = useTranslations();

  if (loading) {
    return (
      <p className="px-4 py-8 text-sm text-xiio-muted text-center">{t("common.loading")}</p>
    );
  }

  if (filteredThreads.length === 0) {
    const emptyMsg =
      mainTab === "requests" ? t("dm.tabs.requestsEmpty") : t("dm.empty");
    return <p className="px-4 py-8 text-sm text-xiio-muted text-center">{emptyMsg}</p>;
  }

  return (
    <ul className="divide-y divide-white/5">
      {filteredThreads.map((th) => (
        <li key={th.threadId}>
          <DmThreadListItem thread={th} />
        </li>
      ))}
    </ul>
  );
}
