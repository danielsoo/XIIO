"use client";

import Link from "next/link";
import { useState } from "react";
import WatchMoreSections from "@/components/watch/WatchMoreSections";
import { useTranslations } from "@/context/LocaleContext";
import {
  filmingLocationFor,
  languageFor,
  productionJournalFor,
  releaseDateFor,
  reviewsFor,
} from "@/data/watchExtras";
import { formatDurationMinutes, gradientForTitle } from "@/lib/works/catalog-ui";
import { aspectRatioMessageKey } from "@/lib/works/aspect-ratio";
import type { PublicWorkCredit } from "@/types/watch";
import type { VideoAspectRatio, WorkSection } from "@/types/work";

export type WatchDetailTab = "overview" | "details" | "credits" | "reviews";

const TABS: WatchDetailTab[] = ["overview", "details", "credits", "reviews"];

const TAB_LABEL_KEYS: Record<WatchDetailTab, string> = {
  overview: "watch.tabs.overview",
  details: "watch.tabs.details",
  credits: "watch.tabs.credits",
  reviews: "watch.tabs.reviews",
};

type Props = {
  ownerUid: string;
  workId: string;
  section: WorkSection;
  title: string;
  description?: string;
  durationSec?: number;
  approvedCategory?: string;
  approvedAspectRatio?: VideoAspectRatio;
  approvedSchoolId?: string;
  approvedSchoolName?: string;
  credits: PublicWorkCredit[];
};

function DetailRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <span className="text-[13px] text-white/45">{label}</span>
      <span className="text-[13.5px] text-white font-medium">{value}</span>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] transition"
      >
        {content}
      </Link>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.06] last:border-b-0">
      {content}
    </div>
  );
}

export default function WatchDetailTabs({
  ownerUid,
  workId,
  section,
  title,
  description,
  durationSec,
  approvedCategory,
  approvedAspectRatio,
  approvedSchoolId,
  approvedSchoolName,
  credits,
}: Props) {
  const { t } = useTranslations();
  const [tab, setTab] = useState<WatchDetailTab>("overview");

  const journal = productionJournalFor(workId);
  const reviews = reviewsFor(workId);
  const behindTheScenes = [0, 1, 2, 3];
  const productionStills = [0, 1, 2, 3, 4, 5];

  return (
    <section className="mt-6">
      <div className="sticky top-[60px] z-20 -mx-1 mb-7 flex gap-7 overflow-x-auto border-b border-white/[0.08] bg-[#08090b]/95 px-1 pt-1 backdrop-blur-md sm:gap-8">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`pb-4 text-[14.5px] transition ${
              tab === id
                ? "border-b-2 border-white text-white font-semibold"
                : "text-white/45 hover:text-white/70"
            }`}
          >
            {t(TAB_LABEL_KEYS[id])}
          </button>
        ))}
      </div>

      <div className={tab === "overview" ? "flex flex-col gap-14" : "hidden"}>
          <div className="max-w-3xl">
            {description ? (
              <p className="text-white/80 text-sm md:text-base whitespace-pre-wrap">{description}</p>
            ) : (
              <p className="text-white/40 text-sm">{t("watch.tabs.overviewEmpty")}</p>
            )}
          </div>

          <div>
            <h2 className="text-[19px] font-bold text-white mb-5">{t("watch.tabs.behindTheScenes")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {behindTheScenes.map((i) => (
                <div
                  key={i}
                  className={`aspect-[4/3] rounded-xl border border-white/[0.06] ${gradientForTitle(`${title}-bts-${i}`)}`}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-[19px] font-bold text-white mb-5">{t("watch.tabs.productionStills")}</h2>
            <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
              {productionStills.map((i) => (
                <div
                  key={i}
                  className={`shrink-0 w-[240px] aspect-[3/2] rounded-xl border border-white/[0.06] ${gradientForTitle(`${title}-still-${i}`)}`}
                />
              ))}
            </div>
          </div>

          <div className="max-w-3xl">
            <h2 className="text-[19px] font-bold text-white mb-5">{t("watch.tabs.productionJournal")}</h2>
            <div className="flex flex-col">
              {journal.map((entry, i) => (
                <div key={i} className="py-5 border-b border-white/[0.06] last:border-b-0">
                  <p className="text-[12px] uppercase tracking-[0.08em] text-xiio-accent font-bold mb-2.5">
                    {entry.date}
                  </p>
                  <p className="text-[14.5px] leading-relaxed text-white/70">{entry.text}</p>
                </div>
              ))}
            </div>
          </div>
      </div>

      <div className={tab === "details" ? "max-w-md" : "hidden"}>
          {approvedCategory ? <DetailRow label={t("watch.tabs.genre")} value={approvedCategory} /> : null}
          {durationSec ? <DetailRow label={t("watch.tabs.runtime")} value={formatDurationMinutes(durationSec)} /> : null}
          <DetailRow label={t("watch.tabs.language")} value={languageFor(workId)} />
          <DetailRow label={t("watch.tabs.releaseDate")} value={releaseDateFor(workId)} />
          <DetailRow label={t("watch.tabs.filmingLocation")} value={filmingLocationFor(workId)} />
          {approvedAspectRatio ? (
            <DetailRow label={t("watch.tabs.aspectRatio")} value={t(aspectRatioMessageKey(approvedAspectRatio))} />
          ) : null}
          {approvedSchoolId && approvedSchoolName ? (
            <DetailRow label={t("watch.tabs.school")} value={approvedSchoolName} href={`/school/${approvedSchoolId}`} />
          ) : null}
      </div>

      <div className={tab === "credits" ? "max-w-2xl" : "hidden"}>
          <p className="text-[12px] text-white/40 mb-4.5">{t("watch.tabs.creditsHint")}</p>
          {credits.length > 0 ? (
            <div className="flex flex-col">
              {credits.map((c) => {
                const inner = (
                  <>
                    <div
                      className={`w-11 h-11 rounded-full shrink-0 ${gradientForTitle(c.displayName)} overflow-hidden`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-semibold text-white truncate">{c.displayName}</p>
                      <p className="text-[12.5px] text-white/45 capitalize">
                        {c.characterName || t(`watch.creditRole.${c.role}`)}
                      </p>
                    </div>
                    {c.profileHref ? (
                      <span className="text-[13px] text-xiio-accent shrink-0">{t("watch.tabs.viewProfile")} ›</span>
                    ) : null}
                  </>
                );
                return c.profileHref ? (
                  <Link
                    key={c.id}
                    href={c.profileHref}
                    className="flex items-center gap-3.5 py-4 px-1 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.03] transition"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={c.id} className="flex items-center gap-3.5 py-4 px-1 border-b border-white/[0.06] last:border-b-0">
                    {inner}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/40 text-sm">{t("watch.tabs.creditsEmpty")}</p>
          )}
      </div>

      <div className={tab === "reviews" ? "block" : "hidden"}>
        <div className="max-w-2xl flex flex-col">
            {reviews.map((rv, i) => (
              <div key={i} className="py-5 border-b border-white/[0.06] last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-semibold text-white">{rv.name}</span>
                  <span className="text-[11.5px] text-white/35">{rv.time}</span>
                </div>
                <div className="text-[13px] text-xiio-gold tracking-[0.05em] mb-2.5">{rv.stars}</div>
                <p className="text-[14.5px] leading-relaxed text-white/70">{rv.text}</p>
              </div>
            ))}
        </div>
        {tab === "reviews" ? (
          <WatchMoreSections
            section={section}
            ownerUid={ownerUid}
            workId={workId}
            showFromSameCreator={false}
          />
        ) : null}
      </div>
    </section>
  );
}
