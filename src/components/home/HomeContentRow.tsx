"use client";

import { useRef } from "react";
import Link from "next/link";
import HomeStoryCard from "@/components/home/HomeStoryCard";
import { IconChevronRight, IconScrollNext } from "@/components/icons/MockupIcons";
import { MOCKUP_HOME_STYLES } from "@/lib/mockupHomeSpec";
import { MOCKUP_MEASURES } from "@/lib/mockupLayout";
import type { HomeStoryItem } from "@/lib/homeMockData";

type Props = {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  items: HomeStoryItem[];
  variant?: "featured" | "surface";
  showScrollButton?: boolean;
};

export default function HomeContentRow({
  title,
  viewAllHref,
  viewAllLabel,
  items,
  variant = "featured",
  showScrollButton = false,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isFeatured = variant === "featured";
  const rowGapStyle = isFeatured
    ? MOCKUP_HOME_STYLES.featuredRowGap
    : MOCKUP_HOME_STYLES.surfaceRowGap;
  const scrollerMinH = isFeatured
    ? MOCKUP_MEASURES.featuredCardWidth * (10 / 16)
    : MOCKUP_MEASURES.surfaceCardWidth * (10 / 16);

  const scroll = () => {
    const step = isFeatured
      ? MOCKUP_MEASURES.featuredCardWidth + MOCKUP_MEASURES.featuredCardGap
      : MOCKUP_MEASURES.surfaceCardWidth + MOCKUP_MEASURES.surfaceCardGap;
    scrollerRef.current?.scrollBy({ left: step, behavior: "smooth" });
  };

  return (
    <section className="space-y-4 min-w-0 w-full">
      <div className="flex items-center justify-between gap-4 flex-nowrap">
        <div className="flex items-center gap-1.5 shrink-0 min-w-0">
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
          {showScrollButton ? (
            <button
              type="button"
              onClick={scroll}
              className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5"
              aria-label="Scroll next"
            >
              <IconScrollNext />
            </button>
          ) : null}
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex overflow-x-auto pb-1 scrollbar-none"
        style={{
          ...rowGapStyle,
          scrollbarWidth: "none",
          minHeight: `calc(${scrollerMinH}px * var(--mockup-scale))`,
        }}
      >
        {items.map((item) => (
          <HomeStoryCard key={item.id} item={item} variant={variant} />
        ))}
      </div>
    </section>
  );
}
