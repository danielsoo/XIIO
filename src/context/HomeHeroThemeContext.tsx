"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DEFAULT_HOME_HERO_THEME,
  HOME_HERO_PREVIEW_STORAGE_KEY,
  hexToRgbTuple,
  parseFirestoreHomeTheme,
  parseStoredPreview,
  rgbTupleToCssVar,
  themeFromHeroHex,
  type HomeHeroTheme,
  type RgbTuple,
} from "@/lib/homeHeroColors";
import { useAdminAccess } from "@/hooks/useAdminAccess";

type HomeHeroThemeContextValue = {
  theme: HomeHeroTheme;
  rgbTuple: RgbTuple;
  overlayEnabled: boolean;
  heroStyle: CSSProperties;
  setPreviewHeroHex: (heroHex: string) => void;
  setPreviewOverlayEnabled: (enabled: boolean) => void;
  clearPreview: () => void;
  hasPreview: boolean;
};

const HomeHeroThemeContext = createContext<HomeHeroThemeContextValue | null>(null);

function readPreviewFromStorage(): HomeHeroTheme | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(HOME_HERO_PREVIEW_STORAGE_KEY);
  if (!raw) return null;
  return parseStoredPreview(raw);
}

function writePreviewToStorage(theme: HomeHeroTheme | null) {
  if (typeof window === "undefined") return;
  if (!theme) {
    localStorage.removeItem(HOME_HERO_PREVIEW_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    HOME_HERO_PREVIEW_STORAGE_KEY,
    JSON.stringify({ heroHex: theme.heroHex, overlayEnabled: theme.overlayEnabled })
  );
}

export function HomeHeroThemeProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAdminAccess();
  const [firestoreTheme, setFirestoreTheme] = useState<HomeHeroTheme | null>(null);
  const [previewTheme, setPreviewTheme] = useState<HomeHeroTheme | null>(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setPreviewTheme(null);
      setPreviewLoaded(true);
      return;
    }
    setPreviewTheme(readPreviewFromStorage());
    setPreviewLoaded(true);
  }, [isAdmin]);

  useEffect(() => {
    if (!db) {
      void fetch("/api/site/home-theme")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.heroHex) return;
          const parsed = parseFirestoreHomeTheme(data as Record<string, unknown>);
          if (parsed) setFirestoreTheme(parsed);
        })
        .catch(() => {});
      return;
    }

    return onSnapshot(
      doc(db, "config", "homeTheme"),
      (snap) => {
        if (!snap.exists()) {
          setFirestoreTheme(null);
          return;
        }
        setFirestoreTheme(
          parseFirestoreHomeTheme(snap.data() as Record<string, unknown>)
        );
      },
      () => {
        void fetch("/api/site/home-theme")
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (!data?.heroHex) return;
            const parsed = parseFirestoreHomeTheme(data as Record<string, unknown>);
            if (parsed) setFirestoreTheme(parsed);
          })
          .catch(() => {});
      }
    );
  }, []);

  const effectiveTheme = useMemo(() => {
    if (isAdmin && previewLoaded && previewTheme) return previewTheme;
    return firestoreTheme ?? DEFAULT_HOME_HERO_THEME;
  }, [isAdmin, previewLoaded, previewTheme, firestoreTheme]);

  const rgbTuple = useMemo(
    () => hexToRgbTuple(effectiveTheme.heroHex) ?? hexToRgbTuple(DEFAULT_HOME_HERO_THEME.heroHex)!,
    [effectiveTheme.heroHex]
  );

  const heroStyle = useMemo(
    (): CSSProperties => ({
      ["--hero-blue-rgb" as string]: rgbTupleToCssVar(rgbTuple),
      ["--hero-cta" as string]: effectiveTheme.ctaHex,
      ["--hero-cta-hover" as string]: effectiveTheme.ctaHoverHex,
    }),
    [rgbTuple, effectiveTheme.ctaHex, effectiveTheme.ctaHoverHex]
  );

  const setPreviewHeroHex = useCallback(
    (heroHex: string) => {
      if (!isAdmin) return;
      setPreviewTheme((prev) => {
        const overlayEnabled = prev?.overlayEnabled ?? effectiveTheme.overlayEnabled;
        const next = themeFromHeroHex(heroHex, overlayEnabled);
        if (!next) return prev;
        writePreviewToStorage(next);
        return next;
      });
    },
    [isAdmin, effectiveTheme.overlayEnabled]
  );

  const setPreviewOverlayEnabled = useCallback(
    (enabled: boolean) => {
      if (!isAdmin) return;
      setPreviewTheme((prev) => {
        const base = prev ?? effectiveTheme;
        const next: HomeHeroTheme = { ...base, overlayEnabled: enabled };
        writePreviewToStorage(next);
        return next;
      });
    },
    [isAdmin, effectiveTheme]
  );

  const clearPreview = useCallback(() => {
    setPreviewTheme(null);
    writePreviewToStorage(null);
  }, []);

  const value = useMemo(
    (): HomeHeroThemeContextValue => ({
      theme: effectiveTheme,
      rgbTuple,
      overlayEnabled: effectiveTheme.overlayEnabled,
      heroStyle,
      setPreviewHeroHex,
      setPreviewOverlayEnabled,
      clearPreview,
      hasPreview: isAdmin && previewTheme !== null,
    }),
    [
      effectiveTheme,
      rgbTuple,
      heroStyle,
      setPreviewHeroHex,
      setPreviewOverlayEnabled,
      clearPreview,
      isAdmin,
      previewTheme,
    ]
  );

  return (
    <HomeHeroThemeContext.Provider value={value}>{children}</HomeHeroThemeContext.Provider>
  );
}

export function useHomeHeroTheme(): HomeHeroThemeContextValue {
  const ctx = useContext(HomeHeroThemeContext);
  if (!ctx) {
    throw new Error("useHomeHeroTheme must be used within HomeHeroThemeProvider");
  }
  return ctx;
}
