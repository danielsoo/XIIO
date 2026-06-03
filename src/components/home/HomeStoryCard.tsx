"use client";

import Image from "next/image";
import Link from "next/link";
import { IconPlus } from "@/components/icons/MockupIcons";
import { MOCKUP_HOME, MOCKUP_HOME_STYLES } from "@/lib/mockupHomeSpec";
import type { HomeStoryItem } from "@/lib/homeMockData";

type Props = {
  item: HomeStoryItem;
  variant?: "featured" | "surface";
};

export default function HomeStoryCard({ item, variant = "featured" }: Props) {
  const isFeatured = variant === "featured";
  const href = item.href ?? "/movies";
  const cardWidthStyle = isFeatured
    ? MOCKUP_HOME_STYLES.featuredCardWidth
    : MOCKUP_HOME_STYLES.surfaceCardWidth;

  if (isFeatured) {
    return (
      <Link
        href={href}
        className={`group relative shrink-0 ${MOCKUP_HOME.cardRadius} overflow-hidden border border-white/[0.08] hover:border-white/15 transition`}
        style={cardWidthStyle}
      >
        <div className="relative aspect-[233/134] w-full">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="300px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <button
            type="button"
            className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white/90 hover:bg-black/70"
            aria-label="Add to list"
            onClick={(e) => e.preventDefault()}
          >
            <IconPlus />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="font-semibold text-white text-sm leading-tight">{item.title}</p>
            <p className="text-[11px] text-white/55 mt-0.5">
              {item.category} · {item.duration}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group shrink-0" style={cardWidthStyle}>
      <div
        className={`relative aspect-[177/111] w-full ${MOCKUP_HOME.cardRadius} overflow-hidden border border-white/[0.08] hover:border-white/15 transition mb-2`}
      >
        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="200px" />
      </div>
      <p className="font-medium text-white text-sm leading-tight px-0.5">{item.title}</p>
      <p className="text-[11px] text-white/45 mt-0.5 px-0.5">{item.duration}</p>
    </Link>
  );
}
