"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReportContentModal from "@/components/report/ReportContentModal";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useElementFullscreen } from "@/hooks/useElementFullscreen";
import { useRecordEngagementView } from "@/hooks/useRecordEngagementView";
import type { PromoShort } from "@/types/promoShort";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-7 h-7 transition drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] ${filled ? "fill-xiio-accent text-xiio-accent" : "fill-none text-white"}`}
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
    <svg
      viewBox="0 0 24 24"
      className="w-7 h-7 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-7 h-7 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1-1-4-1-5 2-8 2-4-1-4-1z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 22v-3" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-7 h-7 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-7 h-7 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
    </svg>
  );
}

export type PromoShortLayout = "overlay" | "stacked";

function PlayerChrome({
  item,
  isActive,
  isFullscreen,
  layout,
  compact,
  onToggleFullscreen,
  onExitFullscreen,
}: {
  item: PromoShort;
  isActive: boolean;
  isFullscreen: boolean;
  layout: PromoShortLayout;
  compact?: boolean;
  onToggleFullscreen: () => void;
  onExitFullscreen: () => void;
}) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const persisted = Boolean(item.ownerUid && item.workId);
  const [liked, setLiked] = useState(item.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(item.likeCount ?? 0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeHint, setLikeHint] = useState(false);
  const [shareHint, setShareHint] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useRecordEngagementView(item.ownerUid, item.workId, "promo", isActive && persisted);

  useEffect(() => {
    setLiked(item.likedByMe ?? false);
    setLikeCount(item.likeCount ?? 0);
  }, [item.id, item.likedByMe, item.likeCount]);

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

  const toggleLike = useCallback(async () => {
    if (persisted) {
      if (!user) {
        setLikeHint(true);
        window.setTimeout(() => setLikeHint(false), 3000);
        return;
      }
      if (likeBusy) return;
      const nextLiked = !liked;
      setLikeBusy(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/engagement/like", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownerUid: item.ownerUid,
            workId: item.workId,
            liked: nextLiked,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { likeCount?: number; liked?: boolean };
        if (res.ok) {
          setLiked(Boolean(data.liked ?? nextLiked));
          if (typeof data.likeCount === "number") setLikeCount(data.likeCount);
          else setLikeCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));
        }
      } finally {
        setLikeBusy(false);
      }
      return;
    }

    setLiked((prev) => {
      setLikeCount((c) => c + (prev ? -1 : 1));
      return !prev;
    });
  }, [persisted, user, likeBusy, liked, item.ownerUid, item.workId]);

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

  const tallMeta = layout === "stacked" || isFullscreen;

  const cardShellClass = isFullscreen
    ? "relative w-full h-full max-w-lg mx-auto rounded-2xl overflow-hidden bg-black"
    : `relative mx-auto w-full max-w-lg rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-black/50 ${
        compact ? "max-h-[min(72vh,680px)]" : "max-h-[min(85vh,780px)]"
      }`;

  const overlayBandClass = tallMeta
    ? "h-[35%] min-h-[7.5rem] md:min-h-[9rem]"
    : "h-[36%] min-h-[100px] md:min-h-[112px]";

  const actionButtons = (
    <div className="flex flex-col items-center justify-start gap-5 shrink-0 pt-0.5">
      <button
        type="button"
        onClick={() => void toggleLike()}
        disabled={likeBusy}
        className="flex flex-col items-center gap-1 disabled:opacity-60 hover:opacity-80 transition-opacity"
        aria-pressed={liked}
        aria-label={t("home.promoLike")}
      >
        <HeartIcon filled={liked} />
        <span className="text-xs font-semibold text-white tabular-nums drop-shadow-sm">
          {likeCount.toLocaleString()}
        </span>
        {likeHint && (
          <span className="text-[10px] text-amber-200 text-center max-w-[4.5rem] leading-tight drop-shadow-sm">
            <Link href="/login" className="underline hover:text-white">
              {t("engagement.loginToLike")}
            </Link>
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => void handleShare()}
        className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
        aria-label={t("home.promoShare")}
      >
        <ShareIcon />
        {shareHint && (
          <span className="text-[10px] font-medium text-white/90 drop-shadow-sm">
            {t("home.promoShareCopied")}
          </span>
        )}
      </button>
      {persisted && item.ownerUid && item.workId && (
        <button
          type="button"
          onClick={() => {
            if (!user) {
              setLikeHint(true);
              return;
            }
            setReportOpen(true);
          }}
          className="hover:opacity-80 transition-opacity"
          aria-label={t("watch.report")}
        >
          <ReportIcon />
        </button>
      )}
    </div>
  );

  const metaBlock = (tall: boolean) => (
    <div className={`flex-1 min-w-0 text-left pr-2 ${tall ? "flex flex-col justify-start min-h-0" : ""}`}>
      <h3
        className={`font-bold leading-tight truncate ${
          tall ? "text-xl md:text-2xl text-white" : "text-lg md:text-2xl text-white"
        }`}
      >
        {item.title}
      </h3>
      <p className={`text-sm ${tall ? "text-white/75 mt-1" : "text-white/80 mt-0.5 md:mt-1"}`}>
        {t("home.promoDirector", { name: item.director })}
      </p>
      <p
        className={
          tall
            ? "mt-2 text-sm md:text-base text-white/85 leading-relaxed line-clamp-4 md:line-clamp-6"
            : "text-xs md:text-sm text-white/65 mt-1.5 line-clamp-3 md:line-clamp-4 leading-snug"
        }
      >
        {item.description}
      </p>
    </div>
  );

  const fullscreenControls = (
    <div className="absolute top-3 right-3 z-20">
      {isFullscreen ? (
        <button
          type="button"
          onClick={onExitFullscreen}
          className="hover:opacity-80 transition-opacity"
          aria-label={t("shorts.exitFullscreen")}
        >
          <CollapseIcon />
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="hover:opacity-80 transition-opacity"
          aria-label={t("shorts.fullscreen")}
        >
          <ExpandIcon />
        </button>
      )}
    </div>
  );

  const bottomOverlay = (
    <div className={`absolute inset-x-0 bottom-0 flex flex-col pointer-events-none ${overlayBandClass}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[6px] supports-[backdrop-filter]:bg-black/5" />
      <div className="relative z-10 flex flex-1 min-w-0 items-start justify-between gap-3 px-4 pt-3 pb-4 md:px-6 md:pt-3.5 md:pb-5 pointer-events-auto">
        {metaBlock(tallMeta)}
        {actionButtons}
      </div>
    </div>
  );

  return (
    <>
      {persisted && item.ownerUid && item.workId && (
        <ReportContentModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="promo"
          targetOwnerUid={item.ownerUid}
          targetWorkId={item.workId}
        />
      )}
      <div
        className={cardShellClass}
        style={isFullscreen ? undefined : { aspectRatio: item.aspectRatio }}
      >
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

        {fullscreenControls}
        {bottomOverlay}
      </div>
    </>
  );
}

export default function PromoShortPlayer({
  item,
  isActive,
  embedded = true,
  layout,
  compact = false,
  className = "",
}: {
  item: PromoShort;
  isActive: boolean;
  embedded?: boolean;
  layout?: PromoShortLayout;
  /** 홈 스포트라이트 등 낮은 카드 높이 */
  compact?: boolean;
  className?: string;
}) {
  const resolvedLayout: PromoShortLayout = layout ?? "stacked";
  const { ref, active, fallbackActive, toggle, exit } = useElementFullscreen<HTMLDivElement>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const chrome = (
    <PlayerChrome
      item={item}
      isActive={isActive}
      isFullscreen={active}
      layout={resolvedLayout}
      compact={compact}
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
