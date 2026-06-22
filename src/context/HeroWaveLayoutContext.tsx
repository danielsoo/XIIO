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
import { usePathname } from "next/navigation";
import { MOCKUP_MEASURES } from "@/lib/mockupLayout";

const GRAD_FLAT_PERCENT = 39;
const GRAD_START_OFFSET_PERCENT = 5;
const DEFAULT_GRAD_START = GRAD_FLAT_PERCENT + GRAD_START_OFFSET_PERCENT;

export type HeroWaveRect = {
  /** px from hero section left edge to image strip start */
  insetLeft: number;
  /** px from hero section right edge (e.g. content padding) */
  insetRight: number;
  /** Content band height aligned to My List bottom */
  height: number;
  /** Wave backdrop top offset inside hero section */
  backdropTop: number;
  /** Extra wave height below My List band (lg) */
  backdropExtendBottom: number;
};

const MIN_WAVE_HEIGHT = 240;
const MIN_STRIP_WIDTH = 200;

const LG_FALLBACK: HeroWaveRect = {
  insetLeft: MOCKUP_MEASURES.heroTextColWidth,
  insetRight: 0,
  height: 400,
  backdropTop: 0,
  backdropExtendBottom: MOCKUP_MEASURES.heroBackdropExtendBottomLg,
};

const MOBILE_FALLBACK: HeroWaveRect = {
  insetLeft: 0,
  insetRight: 0,
  height: 280,
  backdropTop: 0,
  backdropExtendBottom: 0,
};

function getInitialWaveRect(): HeroWaveRect {
  if (typeof window === "undefined") return MOBILE_FALLBACK;
  return window.matchMedia("(min-width: 1024px)").matches ? LG_FALLBACK : MOBILE_FALLBACK;
}

function computeGradStartPercent(section: HTMLElement, text: HTMLElement): number {
  const sr = section.getBoundingClientRect();
  const tr = text.getBoundingClientRect();
  const startPx = Math.max(0, tr.right - sr.left);
  const base = sr.width > 0 ? (startPx / sr.width) * 100 : GRAD_FLAT_PERCENT;
  return Math.min(
    100,
    Math.round((base + GRAD_START_OFFSET_PERCENT) * 10) / 10
  );
}

type ContextValue = {
  waveRect: HeroWaveRect;
  gradStartPercent: number;
  layoutReady: boolean;
  isLgViewport: boolean;
  registerHeroSection: (el: HTMLElement | null) => void;
  registerHeroText: (el: HTMLElement | null) => void;
};

const HeroWaveLayoutContext = createContext<ContextValue | null>(null);

export function HeroWaveLayoutProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sectionRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [waveRect, setWaveRect] = useState<HeroWaveRect>(getInitialWaveRect);
  const [gradStartPercent, setGradStartPercent] = useState(DEFAULT_GRAD_START);
  const [layoutReady, setLayoutReady] = useState(false);
  const [isLgViewport, setIsLgViewport] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false
  );

  const measure = useCallback(() => {
    const lg = window.matchMedia("(min-width: 1024px)").matches;
    setIsLgViewport(lg);
    const section = sectionRef.current;
    const text = textRef.current;

    if (!lg) {
      setWaveRect(MOBILE_FALLBACK);
      setGradStartPercent(DEFAULT_GRAD_START);
      setLayoutReady(section != null);
      return;
    }

    if (!section) {
      setWaveRect(LG_FALLBACK);
      setGradStartPercent(DEFAULT_GRAD_START);
      setLayoutReady(false);
      return;
    }

    const sr = section.getBoundingClientRect();
    const myList = document.getElementById("app-nav-my-list");

    const measuredHeight = myList
      ? Math.round(myList.getBoundingClientRect().bottom - sr.top)
      : LG_FALLBACK.height;

    const sectionWidth = Math.round(sr.width);
    let insetLeft: number = MOCKUP_MEASURES.heroTextColWidth;
    const insetRight = 0;
    const maxInsetLeft = Math.max(0, sectionWidth - MIN_STRIP_WIDTH - insetRight);
    insetLeft = Math.min(insetLeft, maxInsetLeft);

    const height = Math.max(MIN_WAVE_HEIGHT, measuredHeight);

    setWaveRect({
      insetLeft,
      insetRight,
      height,
      backdropTop: 0,
      backdropExtendBottom: MOCKUP_MEASURES.heroBackdropExtendBottomLg,
    });

    if (text) {
      setGradStartPercent(computeGradStartPercent(section, text));
    } else {
      setGradStartPercent(DEFAULT_GRAD_START);
    }

    setLayoutReady(true);
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

  useLayoutEffect(() => {
    setLayoutReady(false);
    measure();
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [pathname, measure]);

  const value = useMemo(
    (): ContextValue => ({
      waveRect,
      gradStartPercent,
      layoutReady,
      isLgViewport,
      registerHeroSection,
      registerHeroText,
    }),
    [
      waveRect,
      gradStartPercent,
      layoutReady,
      isLgViewport,
      registerHeroSection,
      registerHeroText,
    ]
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
