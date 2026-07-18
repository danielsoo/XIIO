"use client";

import { useRef } from "react";
import Link from "next/link";
import HomeStoryCard from "@/components/home/HomeStoryCard";
import SectionLabel from "@/components/layout/SectionLabel";
import { IconScrollNext } from "@/components/icons/MockupIcons";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import { MOCKUP_MEASURES } from "@/lib/mockupLayout";
import type { HomeStoryItem } from "@/lib/homeMockData";
import { useDesktopViewport } from "@/hooks/useDesktopViewport";

type Props = {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  items: HomeStoryItem[];
  variant?: "featured" | "selects";
  headerOnly?: boolean;
  hideHeader?: boolean;
};

function SectionHeaderRow({
  title,
  viewAllHref,
  viewAllLabel,
  onScroll,
  showScrollButton,
  rowWidthClass,
}: {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  onScroll?: () => void;
  showScrollButton?: boolean;
  rowWidthClass: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 flex-nowrap ${rowWidthClass}`}>
      <div className="shrink-0 min-w-0">
        <SectionLabel>{title}</SectionLabel>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={viewAllHref}
          className={`text-white/40 hover:text-white/70 transition ${MOCKUP_HOME.viewAllLink}`}
        >
          {viewAllLabel}
        </Link>
        {showScrollButton ? (
          <button
            type="button"
            onClick={onScroll}
            className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 lg:hidden"
            aria-label="Scroll next"
          >
            <IconScrollNext />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function HomeContentRow({
  title,
  viewAllHref,
  viewAllLabel,
  items,
  variant = "featured",
  headerOnly = false,
  hideHeader = false,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isDesktop = useDesktopViewport();
  // 데스크톱은 한 줄에 고정 5개, 나머지는 자동으로 다음 줄로 넘어감 (잘리지 않음) — 두 variant 모두 5열 폭에 맞춤
  const rowWidthClass = MOCKUP_HOME.featuredRowWidth;
  const displayItems = items;

  const scroll = () => {
    scrollerRef.current?.scrollBy({
      left: MOCKUP_MEASURES.featuredCardWidth + MOCKUP_MEASURES.featuredCardGap,
      behavior: "smooth",
    });
  };

  if (headerOnly) {
    return (
      <SectionHeaderRow
        title={title}
        viewAllHref={viewAllHref}
        viewAllLabel={viewAllLabel}
        rowWidthClass={MOCKUP_HOME.featuredRowWidth}
      />
    );
  }

  return (
    <section className={`min-w-0 w-full ${hideHeader ? "" : "space-y-4"}`}>
      {!hideHeader ? (
        <SectionHeaderRow
          title={title}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
          onScroll={scroll}
          showScrollButton
          rowWidthClass={rowWidthClass}
        />
      ) : null}

      <div
        className={`hidden lg:grid min-w-0 w-full max-w-full ${MOCKUP_HOME.featuredRowGap} ${rowWidthClass}`}
        style={{ gridTemplateColumns: `repeat(${MOCKUP_MEASURES.featuredRowItemCount}, minmax(0, 1fr))` }}
      >
        {displayItems.map((item, index) => (
          <HomeStoryCard
            key={item.id}
            item={item}
            variant="featured"
            videoQueueKey={`desktop:${title}:${index}:${item.id}`}
            videoEnabled={isDesktop === true}
          />
        ))}
      </div>

      <div
        ref={scrollerRef}
        className={`flex overflow-x-auto pb-1 scrollbar-none lg:hidden ${MOCKUP_HOME.featuredRowGap}`}
        style={{ scrollbarWidth: "none" }}
      >
        {displayItems.map((item, index) => (
          <HomeStoryCard
            key={item.id}
            item={item}
            variant="featured"
            videoQueueKey={`mobile:${title}:${index}:${item.id}`}
            videoEnabled={isDesktop === false}
          />
        ))}
      </div>
    </section>
  );
}
