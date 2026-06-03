"use client";

import { useRef } from "react";
import Link from "next/link";
import HomeStoryCard from "@/components/home/HomeStoryCard";
import { IconChevronRight, IconScrollNext } from "@/components/icons/MockupIcons";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
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
  const rowGap = isFeatured ? MOCKUP_HOME.featuredRowGap : MOCKUP_HOME.surfaceRowGap;

  const scroll = () => {
    scrollerRef.current?.scrollBy({ left: 260, behavior: "smooth" });
  };

  return (
    <section className="space-y-4 min-w-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <IconChevronRight className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <div className="flex items-center gap-2">
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
        className={`flex ${rowGap} overflow-x-auto pb-1 scrollbar-none`}
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <HomeStoryCard key={item.id} item={item} variant={variant} />
        ))}
      </div>
    </section>
  );
}
