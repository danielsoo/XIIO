"use client";

import { IconPlayOutline } from "@/components/icons/MockupIcons";
import { MOCKUP_HOME_STYLES } from "@/lib/mockupHomeSpec";
import { framePx } from "@/lib/mockupLayout";

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
    <div className="flex flex-col items-end text-right lg:pb-3">
      <p
        className="font-semibold tracking-[0.2em] text-white/40 uppercase mb-2"
        style={MOCKUP_HOME_STYLES.featuredPanelLabel}
      >
        {label}
      </p>
      <p className="font-semibold text-white mb-0.5" style={MOCKUP_HOME_STYLES.featuredPanelTitle}>
        {title}
      </p>
      <p className="text-white/45 mb-4" style={MOCKUP_HOME_STYLES.featuredPanelMeta}>
        {meta}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-full border border-white/25 flex items-center justify-center text-white/90 hover:bg-white/10 transition"
          style={MOCKUP_HOME_STYLES.featuredPanelPlay}
          aria-label="Play featured story"
        >
          <IconPlayOutline className="w-[calc(20px*var(--frame-scale))] h-[calc(20px*var(--frame-scale))]" />
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: slideCount }).map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all ${
                i === activeIndex ? "bg-white" : "bg-white/25"
              }`}
              style={{
                height: framePx(2),
                width: i === activeIndex ? framePx(28) : framePx(12),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
