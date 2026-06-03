"use client";

import Link from "next/link";
import { useRef } from "react";
import CampusCurrentsBanner from "@/components/home/CampusCurrentsBanner";
import HomeStoryCard from "@/components/home/HomeStoryCard";
import { IconChevronRight, IconScrollNext } from "@/components/icons/MockupIcons";
import { MOCKUP_HOME_STYLES } from "@/lib/mockupHomeSpec";
import { framePx, MOCKUP_MEASURES, SURFACE_CAMPUS_GAP_VAR } from "@/lib/mockupLayout";
import type { HomeStoryItem } from "@/lib/homeMockData";

type Props = {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  items: HomeStoryItem[];
};

function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel,
  onScroll,
}: {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  onScroll: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 flex-nowrap min-w-0">
      <div className="flex items-center gap-1.5 shrink-0">
        <h2
          className="font-semibold text-white whitespace-nowrap"
          style={MOCKUP_HOME_STYLES.sectionTitle}
        >
          {title}
        </h2>
        <IconChevronRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href={viewAllHref} className="text-xs text-white/40 hover:text-white/70 transition">
          {viewAllLabel}
        </Link>
        <button
          type="button"
          onClick={onScroll}
          className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 lg:hidden"
          aria-label="Scroll next"
        >
          <IconScrollNext />
        </button>
      </div>
    </div>
  );
}

export default function HomeSurfaceCampusRow({
  title,
  viewAllHref,
  viewAllLabel,
  items,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = () => {
    scrollerRef.current?.scrollBy({
      left: MOCKUP_MEASURES.surfaceCardWidth + MOCKUP_MEASURES.surfaceCardGap,
      behavior: "smooth",
    });
  };

  const gridStyle = {
    gridTemplateColumns: `${framePx(MOCKUP_MEASURES.surfaceRowWidth)} ${framePx(MOCKUP_MEASURES.campusBannerWidth)}`,
    gap: `var(${SURFACE_CAMPUS_GAP_VAR})`,
  };

  const surfaceGridStyle = {
    ...MOCKUP_HOME_STYLES.surfaceRowGap,
    gridTemplateColumns: `repeat(${items.length}, ${framePx(MOCKUP_MEASURES.surfaceCardWidth)})`,
  };

  return (
    <section className="min-w-0 w-full">
      <div className="mb-4 hidden lg:grid" style={gridStyle}>
        <SectionHeader
          title={title}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
          onScroll={scroll}
        />
        <div aria-hidden />
      </div>

      <div className="mb-4 lg:hidden">
        <SectionHeader
          title={title}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
          onScroll={scroll}
        />
      </div>

      <div className="hidden lg:grid items-stretch" style={gridStyle}>
        <div className="grid" style={surfaceGridStyle}>
          {items.map((item) => (
            <HomeStoryCard key={item.id} item={item} variant="surface" />
          ))}
        </div>
        <CampusCurrentsBanner className="shrink-0 self-stretch" />
      </div>

      <div
        ref={scrollerRef}
        className="flex overflow-x-auto pb-1 scrollbar-none min-w-0 lg:hidden"
        style={{
          ...MOCKUP_HOME_STYLES.surfaceRowGap,
          scrollbarWidth: "none",
        }}
      >
        {items.map((item) => (
          <HomeStoryCard key={item.id} item={item} variant="surface" />
        ))}
      </div>

      <div className="mt-4 lg:hidden">
        <CampusCurrentsBanner />
      </div>
    </section>
  );
}
