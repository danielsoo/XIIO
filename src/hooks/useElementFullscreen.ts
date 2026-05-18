"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useElementFullscreen<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [nativeActive, setNativeActive] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);

  const active = nativeActive || fallbackActive;

  useEffect(() => {
    const onChange = () => {
      setNativeActive(document.fullscreenElement === ref.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!fallbackActive) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFallbackActive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [fallbackActive]);

  const enter = useCallback(async () => {
    const el = ref.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        return;
      }
    } catch {
      /* fallback */
    }
    setFallbackActive(true);
  }, []);

  const exit = useCallback(async () => {
    if (fallbackActive) {
      setFallbackActive(false);
      return;
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }, [fallbackActive]);

  const toggle = useCallback(async () => {
    if (active) await exit();
    else await enter();
  }, [active, enter, exit]);

  return { ref, active, fallbackActive, enter, exit, toggle };
}
