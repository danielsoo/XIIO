"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconPlus } from "@/components/icons/MockupIcons";
import type { HomeStoryItem } from "@/lib/homeMockData";
import { MOCKUP_HOME } from "@/lib/mockupHomeSpec";
import { gradientForTitle } from "@/lib/works/catalog-ui";

type Props = {
  item: HomeStoryItem;
  variant?: "featured" | "surface";
};

function formatMeta(category: string, duration: string): string {
  if (category && duration) return `${category} · ${duration}`;
  return category || duration;
}

function CardThumbnail({
  item,
  sizes,
  className,
}: {
  item: HomeStoryItem;
  sizes: string;
  className?: string;
}) {
  const [thumbFailed, setThumbFailed] = useState(false);

  useEffect(() => {
    setThumbFailed(false);
  }, [item.imageUrl]);

  const showThumbnail = Boolean(item.imageUrl) && !thumbFailed;

  if (showThumbnail) {
    return (
      <Image
        src={item.imageUrl}
        alt=""
        fill
        className={`object-cover ${className ?? ""}`}
        style={item.imageStyle}
        sizes={sizes}
        unoptimized
        onError={() => setThumbFailed(true)}
      />
    );
  }

  return <div className={`absolute inset-0 ${gradientForTitle(item.title)}`} />;
}

export default function HomeStoryCard({ item, variant = "featured" }: Props) {
  const isFeatured = variant === "featured";
  const href = item.href ?? "/movies";
  const widthClass = isFeatured ? MOCKUP_HOME.featuredCardWidth : MOCKUP_HOME.surfaceCardWidth;
  const meta = formatMeta(item.category, item.duration);

  if (isFeatured) {
    return (
      <Link
        href={href}
        className={`group relative min-w-0 ${widthClass} ${MOCKUP_HOME.cardRadius} overflow-hidden border border-white/[0.08] hover:border-white/15 transition`}
      >
        <div className="relative aspect-[233/134] w-full">
          <CardThumbnail item={item} sizes="300px" />
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
            {meta ? (
              <p className="text-[11px] text-white/55 mt-0.5">{meta}</p>
            ) : null}
          </div>
        </div>
      </Link>
    );
  }

  const surfaceMeta = item.duration || item.category;

  return (
    <Link href={href} className={`group min-w-0 ${widthClass}`}>
      <div
        className={`relative aspect-[177/111] w-full ${MOCKUP_HOME.cardRadius} overflow-hidden border border-white/[0.08] hover:border-white/15 transition mb-2`}
      >
        <CardThumbnail item={item} sizes="200px" />
      </div>
      <p className="font-medium text-white text-sm leading-tight px-0.5">{item.title}</p>
      {surfaceMeta ? (
        <p className="text-[11px] text-white/45 mt-0.5 px-0.5">{surfaceMeta}</p>
      ) : null}
    </Link>
  );
}
