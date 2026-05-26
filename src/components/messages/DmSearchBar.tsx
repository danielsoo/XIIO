"use client";

import { useDmInbox } from "@/components/messages/DmInboxContext";
import { useTranslations } from "@/context/LocaleContext";

export default function DmSearchBar() {
  const { search, setSearch } = useDmInbox();
  const { t } = useTranslations();

  return (
    <div className="px-4 pb-2">
      <label className="relative block">
        <span className="sr-only">{t("dm.inbox.searchPlaceholder")}</span>
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xiio-muted pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("dm.inbox.searchPlaceholder")}
          className="w-full rounded-full bg-white/5 border border-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-xiio-muted focus:outline-none focus:border-xiio-accent/50"
        />
      </label>
    </div>
  );
}
