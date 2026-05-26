"use client";

import { useDmInbox } from "@/components/messages/DmInboxContext";
import { useTranslations } from "@/context/LocaleContext";

export default function DmEmptyPane() {
  const { openNewMessage } = useDmInbox();
  const { t } = useTranslations();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="w-24 h-24 rounded-full border-2 border-white/20 flex items-center justify-center mb-6">
        <svg
          className="w-12 h-12 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">{t("dm.inbox.emptyTitle")}</h2>
      <p className="text-sm text-xiio-muted mb-6 max-w-sm">{t("dm.inbox.emptyLead")}</p>
      <button
        type="button"
        onClick={openNewMessage}
        className="px-5 py-2.5 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white text-sm font-semibold transition"
      >
        {t("dm.inbox.sendMessageCta")}
      </button>
    </div>
  );
}
