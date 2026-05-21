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
 * 가로 스와이프(터치·포인터). 스와이프 직후 click은 막아 Link 등 오탭을 방지합니다.
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

    const reset = () => {
      active = false;
      axis = "none";
    };

    const finish = (dx: number, dy: number) => {
      if (!active) return;
      active = false;
      axis = "none";

      if (Math.abs(dy) > Math.abs(dx)) return;

      if (dx < -thresholdPx) {
        blockClickUntilRef.current = Date.now() + 400;
        onSwipeLeftRef.current();
      } else if (dx > thresholdPx) {
        blockClickUntilRef.current = Date.now() + 400;
        onSwipeRightRef.current();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      active = true;
      axis = "none";
      startX = e.clientX;
      startY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (axis === "none" && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        axis = Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";
      }
      if (axis === "horizontal") e.preventDefault();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!active) return;
      finish(e.clientX - startX, e.clientY - startY);
    };

    const onPointerCancel = () => reset();

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      active = true;
      axis = "none";
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (axis === "none" && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        axis = Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";
      }
      if (axis === "horizontal") e.preventDefault();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!active) return;
      const touch = e.changedTouches[0];
      if (!touch) {
        reset();
        return;
      }
      finish(touch.clientX - startX, touch.clientY - startY);
    };

    const onTouchCancel = () => reset();

    const onClickCapture = (e: MouseEvent) => {
      if (Date.now() < blockClickUntilRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchCancel);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [enabled, ref, thresholdPx]);
}
