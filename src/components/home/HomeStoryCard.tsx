"use client";

import Link from "next/link";
import type { HomeStoryItem } from "@/lib/homeMockData";

type Props = {
  item: HomeStoryItem;
  size?: "featured" | "compact";
};

export default function HomeStoryCard({ item, size = "featured" }: Props) {
  const isFeatured = size === "featured";
  const href = item.href ?? "/movies";

  return (
    <Link
      href={href}
      className={`group relative shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition ${
        isFeatured ? "w-[min(72vw,280px)] sm:w-[300px]" : "w-[min(55vw,200px)] sm:w-[220px]"
      }`}
    >
      <div
        className={`relative bg-gradient-to-br ${item.gradient} ${
          isFeatured ? "aspect-[4/5]" : "aspect-[3/4]"
        }`}
      >
        <button
          type="button"
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white/80 hover:bg-black/60"
          aria-label="+"
          onClick={(e) => e.preventDefault()}
        >
          +
        </button>
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <p className="font-semibold text-white text-sm leading-tight">{item.title}</p>
          <p className="text-[11px] text-white/55 mt-1">
            {item.category} · {item.duration}
          </p>
        </div>
      </div>
    </Link>
  );
}
