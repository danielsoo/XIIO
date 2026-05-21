"use client";

import { useEffect, useRef, type RefObject } from "react";

type Options = {
  enabled?: boolean;
  thresholdPx?: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

type AxisLock = "none" | "horizontal" | "vertical";

/**
 * 가로 스와이프(터치·마우스 드래그). 중앙 영상 등 자식 위에서도 동작하도록
 * pointer capture + document 레벨 move/up 사용.
 */
export function useHorizontalSwipe(
  ref: RefObject<HTMLElement | null>,
  { enabled = true, thresholdPx = 40, onSwipeLeft, onSwipeRight }: Options
) {
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  const blockClickUntilRef = useRef(0);

  useEffect(() => {
    onSwipeLeftRef.current = onSwipeLeft;
    onSwipeRightRef.current = onSwipeRight;
  }, [onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let startX = 0;
    let startY = 0;
    let active = false;
    let axis: AxisLock = "none";
    let activePointerId: number | null = null;

    const reset = () => {
      active = false;
      axis = "none";
      activePointerId = null;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
    };

    const finish = (dx: number, dy: number) => {
      if (!active) return;

      if (Math.abs(dy) > Math.abs(dx)) return;

      if (dx < -thresholdPx) {
        blockClickUntilRef.current = Date.now() + 400;
        onSwipeLeftRef.current();
      } else if (dx > thresholdPx) {
        blockClickUntilRef.current = Date.now() + 400;
        onSwipeRightRef.current();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!active || (activePointerId != null && e.pointerId !== activePointerId)) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (axis === "none" && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        axis = Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";
      }
      if (axis === "horizontal") {
        e.preventDefault();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!active || (activePointerId != null && e.pointerId !== activePointerId)) return;

      finish(e.clientX - startX, e.clientY - startY);

      if (el.hasPointerCapture?.(e.pointerId)) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      reset();
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (activePointerId != null && e.pointerId !== activePointerId) return;
      if (el.hasPointerCapture?.(e.pointerId)) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      reset();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (!el.contains(e.target as Node)) return;

      active = true;
      activePointerId = e.pointerId;
      axis = "none";
      startX = e.clientX;
      startY = e.clientY;

      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      document.addEventListener("pointermove", onPointerMove, { passive: false });
      document.addEventListener("pointerup", onPointerUp);
      document.addEventListener("pointercancel", onPointerCancel);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (Date.now() < blockClickUntilRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      reset();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [enabled, ref, thresholdPx]);
}
