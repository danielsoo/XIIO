"use client";

import { useRef } from "react";
import Link from "next/link";
import HomeStoryCard from "@/components/home/HomeStoryCard";
import type { HomeStoryItem } from "@/lib/homeMockData";

type Props = {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  items: HomeStoryItem[];
  size?: "featured" | "compact";
};

export default function HomeContentRow({
  title,
  viewAllHref,
  viewAllLabel,
  items,
  size = "featured",
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" aria-hidden />
          <h2 className="text-xs font-bold tracking-[0.2em] text-white/90 uppercase">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link href={viewAllHref} className="text-xs text-white/45 hover:text-white transition">
            {viewAllLabel}
          </Link>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5"
            aria-label="Next"
          >
            →
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10"
      >
        {items.map((item) => (
          <HomeStoryCard key={item.id} item={item} size={size} />
        ))}
      </div>
    </section>
  );
}
