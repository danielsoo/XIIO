"use client";

import { IconPlayOutline } from "@/components/icons/MockupIcons";

type Props = {
  label: string;
  title: string;
  meta: string;
  slideCount?: number;
  activeIndex?: number;
};

export default function HomeFeaturedStoryPanel({
  label,
  title,
  meta,
  slideCount = 5,
  activeIndex = 0,
}: Props) {
  return (
    <div className="flex flex-col items-end text-right">
      <p className="text-[10px] font-semibold tracking-[0.2em] text-sky-400 uppercase mb-2">
        {label}
      </p>
      <div className="flex items-center justify-end gap-3 mb-0.5">
        <p className="text-[14px] font-semibold text-white">{title}</p>
        <button
          type="button"
          className="shrink-0 w-10 h-10 rounded-full border border-white/25 flex items-center justify-center text-white/90 hover:bg-white/10 transition"
          aria-label="Play featured story"
        >
          <IconPlayOutline className="w-5 h-5" />
        </button>
      </div>
      <p className="text-[12px] text-white/45 mb-3">{meta}</p>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: slideCount }).map((_, i) => (
          <span
            key={i}
            className={`h-0.5 rounded-full transition-all ${
              i === activeIndex ? "w-7 bg-white" : "w-3 bg-white/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
