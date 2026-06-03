"use client";

import { useRef } from "react";
import Link from "next/link";
import HomeStoryCard from "@/components/home/HomeStoryCard";
import { IconChevronRight, IconScrollNext } from "@/components/icons/MockupIcons";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import { MOCKUP_MEASURES } from "@/lib/mockupLayout";
import type { HomeStoryItem } from "@/lib/homeMockData";

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
      <div className="flex items-center gap-1.5 shrink-0 min-w-0">
        <h2 className={`font-semibold text-white whitespace-nowrap ${MOCKUP_HOME.sectionTitle}`}>
          {title}
        </h2>
        <IconChevronRight className={`text-sky-400 shrink-0 ${MOCKUP_HOME.sectionChevron}`} />
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
  const isFeatured = variant === "featured";
  const rowWidthClass = isFeatured ? MOCKUP_HOME.featuredRowWidth : MOCKUP_HOME.selectsRowWidth;

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
        className={`hidden lg:grid ${MOCKUP_HOME.featuredRowGap} ${rowWidthClass}`}
        style={{ gridTemplateColumns: `repeat(${items.length}, 233px)` }}
      >
        {items.map((item) => (
          <HomeStoryCard key={item.id} item={item} variant="featured" />
        ))}
      </div>

      <div
        ref={scrollerRef}
        className={`flex overflow-x-auto pb-1 scrollbar-none lg:hidden ${MOCKUP_HOME.featuredRowGap}`}
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <HomeStoryCard key={item.id} item={item} variant="featured" />
        ))}
      </div>
    </section>
  );
}
