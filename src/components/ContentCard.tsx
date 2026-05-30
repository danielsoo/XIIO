"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

interface ContentCardProps {
  title: string;
  contentCategory?: string;
  tags?: string[];
  gradient: string;
  thumbnailUrl?: string;
  imageStyle?: CSSProperties;
  href?: string;
  roundedClassName?: string;
}

export default function ContentCard({
  title,
  gradient,
  thumbnailUrl,
  imageStyle,
  href,
  roundedClassName = "rounded-2xl",
}: ContentCardProps) {
  const [thumbFailed, setThumbFailed] = useState(false);

  useEffect(() => {
    setThumbFailed(false);
  }, [thumbnailUrl]);

  const showThumbnail = Boolean(thumbnailUrl) && !thumbFailed;

  const inner = (
    <>
      {showThumbnail ? (
        <Image
          src={thumbnailUrl!}
          alt=""
          fill
          className="object-cover"
          style={imageStyle}
          sizes="(max-width: 768px) 50vw, 25vw"
          unoptimized
          onError={() => setThumbFailed(true)}
        />
      ) : (
        <div className={`absolute inset-0 ${gradient}`} />
      )}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
        <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-black ml-0.5" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    </>
  );

  const className = `group relative block ${roundedClassName} overflow-hidden aspect-video cursor-pointer hover:scale-[1.02] transition-transform duration-200`;

  if (href) {
    return (
      <Link href={href} className={className} aria-label={title}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
