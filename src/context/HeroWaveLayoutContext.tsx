"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MOCKUP_MEASURES } from "@/lib/mockupLayout";

export type HeroWaveRect = {
  top: number;
  left: number;
  right: number;
  height: number;
};

const LG_FALLBACK: HeroWaveRect = {
  top: 0,
  left: MOCKUP_MEASURES.heroTextColWidth,
  right: 0,
  height: 400,
};

const MOBILE_FALLBACK: HeroWaveRect = {
  top: 0,
  left: 0,
  right: 0,
  height: 280,
};

type ContextValue = {
  waveRect: HeroWaveRect;
  registerHeroSection: (el: HTMLElement | null) => void;
  registerHeroText: (el: HTMLElement | null) => void;
};

const HeroWaveLayoutContext = createContext<ContextValue | null>(null);

export function HeroWaveLayoutProvider({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [waveRect, setWaveRect] = useState<HeroWaveRect>(LG_FALLBACK);

  const measure = useCallback(() => {
    const lg = window.matchMedia("(min-width: 1024px)").matches;
    const section = sectionRef.current;

    if (!lg) {
      const sr = section?.getBoundingClientRect();
      setWaveRect({
        ...MOBILE_FALLBACK,
        top: sr ? Math.round(sr.top) : 0,
      });
      return;
    }

    if (!section) {
      setWaveRect(LG_FALLBACK);
      return;
    }

    const sr = section.getBoundingClientRect();
    const text = textRef.current;
    const myList = document.getElementById("app-nav-my-list");
    const textRight = text
      ? text.getBoundingClientRect().right
      : sr.left + MOCKUP_MEASURES.heroTextColWidth;

    const height = myList
      ? Math.max(0, Math.round(myList.getBoundingClientRect().bottom - sr.top))
      : LG_FALLBACK.height;

    setWaveRect({
      top: Math.round(sr.top),
      left: Math.round(textRight),
      right: Math.max(0, Math.round(window.innerWidth - sr.right)),
      height,
    });
  }, []);

  const bindObserver = useCallback(() => {
    observerRef.current?.disconnect();
    const ro = new ResizeObserver(measure);
    observerRef.current = ro;

    if (sectionRef.current) ro.observe(sectionRef.current);
    if (textRef.current) ro.observe(textRef.current);

    const myList = document.getElementById("app-nav-my-list");
    if (myList) ro.observe(myList);

    const sidebarNav = document.querySelector("aside.hidden.lg\\:flex nav");
    if (sidebarNav) ro.observe(sidebarNav);
  }, [measure]);

  const registerHeroSection = useCallback(
    (el: HTMLElement | null) => {
      sectionRef.current = el;
      bindObserver();
      measure();
    },
    [bindObserver, measure]
  );

  const registerHeroText = useCallback(
    (el: HTMLElement | null) => {
      textRef.current = el;
      bindObserver();
      measure();
    },
    [bindObserver, measure]
  );

  useLayoutEffect(() => {
    measure();
    requestAnimationFrame(measure);
    bindObserver();
    window.addEventListener("resize", measure);
    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, bindObserver]);

  const value = useMemo(
    (): ContextValue => ({
      waveRect,
      registerHeroSection,
      registerHeroText,
    }),
    [waveRect, registerHeroSection, registerHeroText]
  );

  return <HeroWaveLayoutContext.Provider value={value}>{children}</HeroWaveLayoutContext.Provider>;
}

export function useHeroWaveLayout(): ContextValue {
  const ctx = useContext(HeroWaveLayoutContext);
  if (!ctx) {
    throw new Error("useHeroWaveLayout must be used within HeroWaveLayoutProvider");
  }
  return ctx;
}

export function useHeroWaveLayoutOptional(): ContextValue | null {
  return useContext(HeroWaveLayoutContext);
}
