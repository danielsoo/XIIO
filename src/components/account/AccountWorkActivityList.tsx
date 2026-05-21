"use client";

import Link from "next/link";
import { useTranslations } from "@/context/LocaleContext";
import { watchHref } from "@/lib/works/catalog-ui";
import type { AccountActivityItem } from "@/types/account-activity";

type Props = {
  items: AccountActivityItem[];
  emptyMessage: string;
  showTarget?: boolean;
};

export default function AccountWorkActivityList({ items, emptyMessage, showTarget }: Props) {
  const { t, formatDateTime } = useTranslations();

  if (items.length === 0) {
    return <p className="text-sm text-xiio-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={`${item.ownerUid}_${item.workId}_${item.target ?? "work"}`}
          className="rounded-xl border border-white/10 bg-xiio-bg/40 px-4 py-3 flex flex-wrap items-center justify-between gap-2"
        >
          <div className="min-w-0">
            <p className="text-white font-medium truncate">{item.title}</p>
            <p className="text-xs text-xiio-muted mt-0.5">
              {t(`myWorks.section.${item.section}`)}
              {showTarget && item.target && (
                <>
                  {" · "}
                  {item.target === "promo"
                    ? t("accountProfile.targetPromo")
                    : t("accountProfile.targetFull")}
                </>
              )}
              {item.at != null && (
                <>
                  {" · "}
                  {formatDateTime(item.at)}
                </>
              )}
            </p>
          </div>
          <Link
            href={watchHref(item.ownerUid, item.workId)}
            className="text-sm text-xiio-accent hover:underline shrink-0"
          >
            {t("accountProfile.watchLink")}
          </Link>
        </li>
      ))}
    </ul>
  );
}
