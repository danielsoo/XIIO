"use client";

import { useRef } from "react";
import Link from "next/link";
import HomeStoryCard from "@/components/home/HomeStoryCard";
import { IconChevronRight, IconScrollNext } from "@/components/icons/MockupIcons";
import { MOCKUP_HOME_STYLES } from "@/lib/mockupHomeSpec";
import { framePx, MOCKUP_MEASURES } from "@/lib/mockupLayout";
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
}: {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  onScroll?: () => void;
  showScrollButton?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 flex-nowrap w-full"
      style={MOCKUP_HOME_STYLES.featuredRowWidth}
    >
      <div className="flex items-center shrink-0 min-w-0" style={{ gap: framePx(6) }}>
        <h2
          className="font-semibold text-white whitespace-nowrap"
          style={MOCKUP_HOME_STYLES.sectionTitle}
        >
          {title}
        </h2>
        <IconChevronRight
          className="text-sky-400 shrink-0 w-[calc(14px*var(--frame-scale))] h-[calc(14px*var(--frame-scale))]"
        />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={viewAllHref}
          className="text-white/40 hover:text-white/70 transition"
          style={MOCKUP_HOME_STYLES.viewAllLink}
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
  const rowWidthStyle = isFeatured
    ? MOCKUP_HOME_STYLES.featuredRowWidth
    : MOCKUP_HOME_STYLES.selectsRowWidth;
  const cardWidth = MOCKUP_MEASURES.featuredCardWidth;
  const cardGap = MOCKUP_MEASURES.featuredCardGap;

  const scroll = () => {
    scrollerRef.current?.scrollBy({ left: cardWidth + cardGap, behavior: "smooth" });
  };

  const gridStyle = {
    ...rowWidthStyle,
    ...MOCKUP_HOME_STYLES.featuredRowGap,
    gridTemplateColumns: `repeat(${items.length}, ${framePx(cardWidth)})`,
  };

  if (headerOnly) {
    return (
      <SectionHeaderRow
        title={title}
        viewAllHref={viewAllHref}
        viewAllLabel={viewAllLabel}
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
        />
      ) : null}

      <div className="hidden lg:grid" style={gridStyle}>
        {items.map((item) => (
          <HomeStoryCard key={item.id} item={item} variant="featured" />
        ))}
      </div>

      <div
        ref={scrollerRef}
        className="flex overflow-x-auto pb-1 scrollbar-none lg:hidden"
        style={{
          ...MOCKUP_HOME_STYLES.featuredRowGap,
          scrollbarWidth: "none",
        }}
      >
        {items.map((item) => (
          <HomeStoryCard key={item.id} item={item} variant="featured" />
        ))}
      </div>
    </section>
  );
}
