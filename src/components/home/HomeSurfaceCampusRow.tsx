"use client";

import Link from "next/link";
import { useRef } from "react";
import CampusCurrentsBanner from "@/components/home/CampusCurrentsBanner";
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
        <h2 className={`font-semibold text-white whitespace-nowrap ${MOCKUP_HOME.sectionTitle}`}>
          {title}
        </h2>
        <IconChevronRight className={`text-sky-400 shrink-0 ${MOCKUP_HOME.sectionChevron}`} />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href={viewAllHref} className={`text-white/40 hover:text-white/70 transition ${MOCKUP_HOME.viewAllLink}`}>
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

  return (
    <section className="min-w-0 w-full">
      <div className="mb-4 hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-6 max-w-full min-w-0">
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

      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-6 items-stretch max-w-full min-w-0">
        <div
          className={`grid min-w-0 w-full ${MOCKUP_HOME.surfaceRowGap}`}
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((item) => (
            <HomeStoryCard key={item.id} item={item} variant="surface" />
          ))}
        </div>
        <CampusCurrentsBanner className="shrink-0 self-stretch" />
      </div>

      <div
        ref={scrollerRef}
        className={`flex overflow-x-auto pb-1 scrollbar-none min-w-0 lg:hidden ${MOCKUP_HOME.surfaceRowGap}`}
        style={{ scrollbarWidth: "none" }}
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
