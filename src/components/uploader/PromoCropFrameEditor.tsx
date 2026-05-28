"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "@/context/LocaleContext";
import type { VideoFileMetadata } from "@/hooks/useVideoFileMetadata";
import { normalizePromoFrameCrop, PROMO_CROP_MAX_ZOOM, PROMO_CROP_MIN_ZOOM } from "@/lib/works/promo-crop";
import {
  adjustZoom,
  clampFrameToDisplay,
  computeObjectContainRect,
  cropToFrameRect,
  frameCenterToCrop,
} from "@/lib/works/promo-crop-interaction";
import type { PromoFrameCrop } from "@/types/work";

type Props = {
  previewUrl: string;
  crop: PromoFrameCrop;
  onCropChange: (next: PromoFrameCrop) => void;
  disabled?: boolean;
  meta?: VideoFileMetadata | null;
};

const ZOOM_STEP = 0.1;
const KEYBOARD_NUDGE_PX = 2;

export default function PromoCropFrameEditor({
  previewUrl,
  crop,
  onCropChange,
  disabled,
  meta,
}: Props) {
  const { t } = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    frameLeft: number;
    frameTop: number;
  } | null>(null);

  const effectiveCrop = normalizePromoFrameCrop(crop);
  const videoW = meta?.width ?? 16;
  const videoH = meta?.height ?? 9;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const display = useMemo(
    () =>
      computeObjectContainRect({
        containerWidth: containerSize.width,
        containerHeight: containerSize.height,
        videoWidth: videoW,
        videoHeight: videoH,
      }),
    [containerSize.width, containerSize.height, videoW, videoH]
  );

  const frame = useMemo(() => cropToFrameRect(effectiveCrop, display), [effectiveCrop, display]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      frameLeft: frame.left,
      frameTop: frame.top,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || containerSize.width <= 0) return;
    const scaleX = containerSize.width / rect.width;
    const scaleY = containerSize.height / rect.height;
    const nextFrame = clampFrameToDisplay(
      {
        left: d.frameLeft + dx * scaleX,
        top: d.frameTop + dy * scaleY,
        width: frame.width,
        height: frame.height,
      },
      display,
      effectiveCrop.zoom
    );
    onCropChange(
      frameCenterToCrop(
        nextFrame.left + nextFrame.width / 2,
        nextFrame.top + nextFrame.height / 2,
        display,
        effectiveCrop.zoom
      )
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  };

  const nudge = useCallback(
    (dx: number, dy: number) => {
      if (disabled) return;
      const centerX = frame.left + frame.width / 2 + dx;
      const centerY = frame.top + frame.height / 2 + dy;
      onCropChange(frameCenterToCrop(centerX, centerY, display, effectiveCrop.zoom));
    },
    [disabled, frame, display, effectiveCrop.zoom, onCropChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    let dx = 0;
    let dy = 0;
    if (e.key === "ArrowLeft") dx = -KEYBOARD_NUDGE_PX;
    if (e.key === "ArrowRight") dx = KEYBOARD_NUDGE_PX;
    if (e.key === "ArrowUp") dy = -KEYBOARD_NUDGE_PX;
    if (e.key === "ArrowDown") dy = KEYBOARD_NUDGE_PX;
    if (dx === 0 && dy === 0) return;
    e.preventDefault();
    nudge(dx, dy);
  };

  const zoomAtMin = effectiveCrop.zoom <= PROMO_CROP_MIN_ZOOM + 1e-6;
  const zoomAtMax = effectiveCrop.zoom >= PROMO_CROP_MAX_ZOOM - 1e-6;

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden border border-white/10 bg-black"
        style={{ aspectRatio: "16 / 9" }}
      >
        <video
          src={previewUrl}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          muted
          playsInline
          preload="metadata"
        />
        {containerSize.width > 0 && frame.width > 0 ? (
          <div
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={t("uploader.promoCropDragLabel")}
            aria-valuenow={Math.round(effectiveCrop.focalX)}
            className={`absolute border-2 border-dashed border-white rounded-sm touch-none ${
              disabled ? "cursor-not-allowed opacity-60" : "cursor-grab active:cursor-grabbing"
            }`}
            style={{
              left: frame.left,
              top: frame.top,
              width: frame.width,
              height: frame.height,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
          />
        ) : null}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={disabled || zoomAtMin}
          onClick={() =>
            onCropChange({ ...effectiveCrop, zoom: adjustZoom(effectiveCrop.zoom, -ZOOM_STEP) })
          }
          aria-label={t("uploader.promoCropZoomOut")}
          className="h-9 w-9 rounded-lg border border-white/20 text-white text-lg leading-none hover:bg-white/10 disabled:opacity-40"
        >
          −
        </button>
        <span className="text-xs text-xiio-muted tabular-nums min-w-[3rem] text-center">
          {effectiveCrop.zoom.toFixed(1)}×
        </span>
        <button
          type="button"
          disabled={disabled || zoomAtMax}
          onClick={() =>
            onCropChange({ ...effectiveCrop, zoom: adjustZoom(effectiveCrop.zoom, ZOOM_STEP) })
          }
          aria-label={t("uploader.promoCropZoomIn")}
          className="h-9 w-9 rounded-lg border border-white/20 text-white text-lg leading-none hover:bg-white/10 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
