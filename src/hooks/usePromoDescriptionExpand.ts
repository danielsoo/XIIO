"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const WHEEL_TRAVEL_PX = { normal: 520, compact: 400 } as const;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function isInsideRoot(root: HTMLElement | null, target: EventTarget | null): boolean {
  if (!root || !target || !(target instanceof Node)) return false;
  return root.contains(target);
}

function canScrollMeta(el: HTMLElement, deltaY: number): boolean {
  if (deltaY > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  if (deltaY < 0) return el.scrollTop > 1;
  return false;
}

export function usePromoDescriptionExpand({
  enabled,
  itemId,
  compact = false,
  scrollRootRef,
  metaScrollRef,
}: {
  enabled: boolean;
  itemId: string;
  compact?: boolean;
  scrollRootRef: RefObject<HTMLElement | null>;
  metaScrollRef?: RefObject<HTMLElement | null>;
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

    const root = scrollRootRef.current;
    if (!root) return;

    const onWheel = (e: WheelEvent) => {
      if (!isInsideRoot(root, e.target)) return;

      const p = progressRef.current;
      const meta = metaScrollRef?.current;

      if (p >= 1 && meta && isInsideRoot(meta, e.target)) {
        if (canScrollMeta(meta, e.deltaY)) {
          meta.scrollTop += e.deltaY;
          e.preventDefault();
          return;
        }
        if (e.deltaY < 0 && meta.scrollTop <= 0 && p > 0) {
          applyDelta(e.deltaY);
          e.preventDefault();
          return;
        }
        return;
      }

      if (e.deltaY > 0 && p < 1) {
        applyDelta(e.deltaY);
        e.preventDefault();
      } else if (e.deltaY < 0 && p > 0) {
        applyDelta(e.deltaY);
        e.preventDefault();
      }
    };

    let touchLastY: number | null = null;
    let touchActive = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (!isInsideRoot(root, e.target)) {
        touchActive = false;
        touchLastY = null;
        return;
      }
      touchActive = true;
      touchLastY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchActive || touchLastY == null || e.touches.length !== 1) return;
      if (!isInsideRoot(root, e.target)) return;

      const y = e.touches[0].clientY;
      const delta = touchLastY - y;
      touchLastY = y;

      const p = progressRef.current;
      const meta = metaScrollRef?.current;

      if (p >= 1 && meta && isInsideRoot(meta, e.target)) {
        if (canScrollMeta(meta, delta)) {
          meta.scrollTop += delta;
          e.preventDefault();
          return;
        }
        if (delta < 0 && meta.scrollTop <= 0 && p > 0) {
          applyDelta(delta);
          e.preventDefault();
          return;
        }
        return;
      }

      if ((delta > 0 && p < 1) || (delta < 0 && p > 0)) {
        applyDelta(delta);
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      touchActive = false;
      touchLastY = null;
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd);
    root.addEventListener("touchcancel", onTouchEnd);

    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, applyDelta, scrollRootRef, metaScrollRef]);

  return { progress, toggle };
}
