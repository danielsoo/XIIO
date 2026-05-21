"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WHEEL_TRAVEL_PX = { normal: 520, compact: 400 } as const;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function usePromoDescriptionExpand({
  enabled,
  itemId,
  compact = false,
}: {
  enabled: boolean;
  itemId: string;
  compact?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const travelPx = compact ? WHEEL_TRAVEL_PX.compact : WHEEL_TRAVEL_PX.normal;

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    setProgress(0);
    progressRef.current = 0;
  }, [itemId]);

  useEffect(() => {
    if (!enabled) {
      setProgress(0);
      progressRef.current = 0;
    }
  }, [enabled]);

  const applyDelta = useCallback(
    (deltaY: number) => {
      const next = clamp01(progressRef.current + deltaY / travelPx);
      if (next !== progressRef.current) {
        progressRef.current = next;
        setProgress(next);
      }
      return next;
    },
    [travelPx]
  );

  const toggle = useCallback(() => {
    const next = progressRef.current >= 1 ? 0 : 1;
    progressRef.current = next;
    setProgress(next);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onWheel = (e: WheelEvent) => {
      const p = progressRef.current;
      if (e.deltaY > 0 && p < 1) {
        applyDelta(e.deltaY);
        e.preventDefault();
      } else if (e.deltaY < 0 && p > 0) {
        applyDelta(e.deltaY);
        e.preventDefault();
      }
    };

    let touchLastY: number | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) touchLastY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchLastY == null || e.touches.length !== 1) return;
      const y = e.touches[0].clientY;
      const delta = touchLastY - y;
      touchLastY = y;
      const p = progressRef.current;
      if ((delta > 0 && p < 1) || (delta < 0 && p > 0)) {
        applyDelta(delta);
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      touchLastY = null;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("wheel", onWheel);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, applyDelta]);

  return { progress, toggle };
}
