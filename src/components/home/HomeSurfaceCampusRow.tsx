"use client";

import Link from "next/link";
import { useRef } from "react";
import CampusCurrentsBanner from "@/components/home/CampusCurrentsBanner";
import HomeStoryCard from "@/components/home/HomeStoryCard";
import { IconChevronRight, IconScrollNext } from "@/components/icons/MockupIcons";
import { MOCKUP_HOME_STYLES } from "@/lib/mockupHomeSpec";
import { MOCKUP_MEASURES, scaledPx, SURFACE_CAMPUS_GAP_VAR } from "@/lib/mockupLayout";
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
          className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5"
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

  const gridCols = `minmax(0, 1fr) ${scaledPx(MOCKUP_MEASURES.campusBannerWidth)}`;
  const gridGap = `var(${SURFACE_CAMPUS_GAP_VAR})`;
  const scrollerStyle = {
    ...MOCKUP_HOME_STYLES.surfaceRowGap,
    scrollbarWidth: "none" as const,
    minHeight: scaledPx(MOCKUP_MEASURES.surfaceCardWidth * (10 / 16)),
  };

  return (
    <section className="min-w-0 w-full">
      <div
        className="mb-4 lg:grid"
        style={{ gridTemplateColumns: gridCols, gap: gridGap }}
      >
        <SectionHeader
          title={title}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
          onScroll={scroll}
        />
        <div className="hidden lg:block" aria-hidden />
      </div>

      <div
        className="lg:grid items-stretch"
        style={{ gridTemplateColumns: gridCols, gap: gridGap }}
      >
        <div
          ref={scrollerRef}
          className="flex overflow-x-auto pb-1 scrollbar-none min-w-0 col-start-1"
          style={scrollerStyle}
        >
          {items.map((item) => (
            <HomeStoryCard key={item.id} item={item} variant="surface" />
          ))}
        </div>
        <CampusCurrentsBanner className="hidden lg:block shrink-0 self-stretch col-start-2" />
      </div>

      <div className="mt-4 lg:hidden">
        <CampusCurrentsBanner />
      </div>
    </section>
  );
}
