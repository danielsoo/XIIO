"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/context/LocaleContext";
import { useElementFullscreen } from "@/hooks/useElementFullscreen";
import type { PromoShort } from "@/types/promoShort";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-7 h-7 transition ${filled ? "fill-xiio-accent text-xiio-accent" : "fill-none text-white"}`}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.75}
      aria-hidden
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
    </svg>
  );
}

function PlayerChrome({
  item,
  isActive,
  isFullscreen,
  embedded,
  onToggleFullscreen,
  onExitFullscreen,
}: {
  item: PromoShort;
  isActive: boolean;
  isFullscreen: boolean;
  embedded: boolean;
  onToggleFullscreen: () => void;
  onExitFullscreen: () => void;
}) {
  const { t } = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likeCount ?? 0);
  const [shareHint, setShareHint] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      void video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  const toggleLike = useCallback(() => {
    setLiked((prev) => {
      setLikeCount((c) => c + (prev ? -1 : 1));
      return !prev;
    });
  }, []);

  const handleShare = useCallback(async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/shorts?promo=${item.id}`
        : `/shorts?promo=${item.id}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: item.title, text: item.description, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint(true);
      window.setTimeout(() => setShareHint(false), 2000);
    } catch {
      /* cancelled */
    }
  }, [item]);

  const frameClass = isFullscreen
    ? "relative w-full h-full min-h-0 flex items-center justify-center bg-black"
    : `relative mx-auto w-full flex items-center justify-center rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-black/50 ${
        embedded ? "max-h-[min(78vh,860px)]" : "max-h-[min(85vh,900px)]"
      }`;

  return (
    <>
      <div className={frameClass} style={isFullscreen ? undefined : { aspectRatio: item.aspectRatio }}>
        <video
          ref={videoRef}
          src={item.videoUrl}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          playsInline
          muted
          loop
          preload={isActive ? "auto" : "none"}
          onDoubleClick={() => onToggleFullscreen()}
        />

        <div className="absolute top-3 right-3 z-20 flex gap-2">
          {isFullscreen && (
            <button
              type="button"
              onClick={onExitFullscreen}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 border border-white/20 backdrop-blur-sm hover:bg-black/70 transition"
              aria-label={t("shorts.exitFullscreen")}
            >
              <CollapseIcon />
            </button>
          )}
          {!isFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 border border-white/20 backdrop-blur-sm hover:bg-black/70 transition"
              aria-label={t("shorts.fullscreen")}
            >
              <ExpandIcon />
            </button>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1/4 min-h-[88px] flex items-stretch pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-transparent" />
          <div className="relative z-10 flex flex-1 min-w-0 items-end justify-between gap-3 px-4 pb-4 pt-6 md:px-7 md:pb-5 pointer-events-auto">
            <div className="flex-1 min-w-0 text-left pr-2">
              <h3 className="text-lg md:text-2xl font-bold text-white leading-tight truncate">{item.title}</h3>
              <p className="text-sm text-white/80 mt-0.5 md:mt-1">
                {t("home.promoDirector", { name: item.director })}
              </p>
              <p className="text-xs md:text-sm text-white/65 mt-1.5 line-clamp-2 md:line-clamp-3 leading-snug">
                {item.description}
              </p>
            </div>
            <div className="flex flex-col items-center justify-end gap-5 shrink-0 pb-0.5">
              <button
                type="button"
                onClick={toggleLike}
                className="flex flex-col items-center gap-1 group"
                aria-pressed={liked}
                aria-label={t("home.promoLike")}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 border border-white/15 backdrop-blur-sm group-hover:bg-white/10 transition">
                  <HeartIcon filled={liked} />
                </span>
                <span className="text-xs font-semibold text-white tabular-nums">{likeCount.toLocaleString()}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleShare()}
                className="flex flex-col items-center gap-1 group"
                aria-label={t("home.promoShare")}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 border border-white/15 backdrop-blur-sm group-hover:bg-white/10 transition">
                  <ShareIcon />
                </span>
                <span className="text-[10px] font-medium text-white/70 max-w-[3rem] text-center leading-tight">
                  {shareHint ? t("home.promoShareCopied") : t("home.promoShare")}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PromoShortPlayer({
  item,
  isActive,
  embedded = true,
  className = "",
}: {
  item: PromoShort;
  isActive: boolean;
  embedded?: boolean;
  className?: string;
}) {
  const { ref, active, fallbackActive, toggle, exit } = useElementFullscreen<HTMLDivElement>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const chrome = (
    <PlayerChrome
      item={item}
      isActive={isActive}
      isFullscreen={active}
      embedded={embedded}
      onToggleFullscreen={() => void toggle()}
      onExitFullscreen={() => void exit()}
    />
  );

  const shellClass = active
    ? fallbackActive
      ? "fixed inset-0 z-[200] flex items-center justify-center bg-black"
      : "w-full h-full min-h-screen bg-black flex items-center justify-center"
    : className;

  const inner = (
    <div ref={ref} className={shellClass}>
      {chrome}
    </div>
  );

  if (fallbackActive && mounted) {
    return createPortal(inner, document.body);
  }

  return inner;
}
