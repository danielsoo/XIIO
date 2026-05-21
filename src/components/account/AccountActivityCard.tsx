"use client";

import Link from "next/link";
import { gradientForTitle } from "@/lib/works/catalog-ui";
import type { WorkSection } from "@/types/work";

type Props = {
  title: string;
  section: WorkSection;
  meta: string;
  href: string;
  watchLabel: string;
  watchDisabled?: boolean;
};

export default function AccountActivityCard({
  title,
  meta,
  href,
  watchLabel,
  watchDisabled,
}: Props) {
  const watchBtn = (
    <span
      className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
        watchDisabled
          ? "border-white/10 text-xiio-muted cursor-not-allowed opacity-50"
          : "border-xiio-accent/50 text-xiio-accent hover:bg-xiio-accent/10"
      }`}
    >
      {watchLabel}
    </span>
  );

  return (
    <li className="rounded-xl border border-white/10 bg-xiio-bg/30 p-3 flex items-center gap-3 hover:border-white/20 transition">
      <div
        className={`aspect-video w-24 shrink-0 rounded-lg ${gradientForTitle(title)} flex items-end p-1.5 overflow-hidden`}
        aria-hidden
      >
        <span className="text-[10px] font-medium text-white/80 line-clamp-2 leading-tight">{title}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white font-medium truncate">{title}</p>
        <p className="text-xs text-xiio-muted mt-0.5 truncate">{meta}</p>
      </div>
      {watchDisabled ? watchBtn : (
        <Link href={href} className="shrink-0">
          {watchBtn}
        </Link>
      )}
    </li>
  );
}
