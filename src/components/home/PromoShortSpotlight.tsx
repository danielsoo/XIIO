"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "@/context/LocaleContext";
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14"
      />
    </svg>
  );
}

function PromoShortFrame({
  item,
  isActive,
}: {
  item: PromoShort;
  isActive: boolean;
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
    const payload = { title: item.title, text: item.description, url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint(true);
      window.setTimeout(() => setShareHint(false), 2000);
    } catch {
      /* 사용자 취소 등 */
    }
  }, [item]);

  return (
    <div
      className={`w-full transition-opacity duration-500 ${isActive ? "opacity-100 relative" : "opacity-0 absolute inset-0 pointer-events-none"}`}
      aria-hidden={!isActive}
    >
      <div
        className="relative mx-auto w-full max-h-[min(78vh,860px)] flex items-center justify-center rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-black/50"
        style={{ aspectRatio: item.aspectRatio }}
      >
        <video
          ref={videoRef}
          src={item.videoUrl}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          playsInline
          muted
          loop
          preload={isActive ? "auto" : "none"}
        />

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
                <span className="text-xs font-semibold text-white tabular-nums">
                  {likeCount.toLocaleString()}
                </span>
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
    </div>
  );
}

export default function PromoShortSpotlight({ items }: { items: PromoShort[] }) {
  const { t } = useTranslations();
  const [index, setIndex] = useState(0);
  const count = items.length;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  if (count === 0) return null;

  const current = items[index];

  return (
    <section className="w-full max-w-5xl mx-auto" aria-label={t("home.promoSectionTitle")}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-xiio-accent mb-1">
            {t("home.promoBadge")}
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-white">{t("home.promoSectionTitle")}</h2>
          <p className="text-sm text-xiio-muted mt-1 max-w-xl">{t("home.promoSectionHint")}</p>
        </div>
        <Link
          href="/shorts"
          className="text-sm text-xiio-muted hover:text-xiio-accent transition shrink-0"
        >
          {t("common.viewAll")}
        </Link>
      </div>

      <div className="relative min-h-[200px]">
        {items.map((item, i) => (
          <PromoShortFrame key={item.id} item={item} isActive={i === index} />
        ))}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition backdrop-blur-sm"
              aria-label={t("home.promoPrev")}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition backdrop-blur-sm"
              aria-label={t("home.promoNext")}
            >
              ›
            </button>
            <div className="flex justify-center gap-2 mt-4">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-8 bg-xiio-accent" : "w-1.5 bg-white/25 hover:bg-white/40"
                  }`}
                  aria-label={`${current.title} ${i + 1}/${count}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
