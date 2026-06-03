"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HsvColorPicker } from "react-colorful";
import { useAuth } from "@/context/AuthContext";
import { useHomeHeroTheme } from "@/context/HomeHeroThemeContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useTranslations } from "@/context/LocaleContext";
import {
  DEFAULT_HOME_HERO_THEME,
  formatHsl,
  formatHsv,
  formatRgb,
  hexToHsv,
  hexToRgbTuple,
  hsvToHex,
  normalizeHex,
  type HsvColor,
} from "@/lib/homeHeroColors";

export default function AdminHomeColorPicker() {
  const pathname = usePathname();
  const { t } = useTranslations();
  const { user } = useAuth();
  const { isAdmin, checked } = useAdminAccess();
  const {
    theme,
    overlayEnabled,
    setPreviewHeroHex,
    setPreviewOverlayEnabled,
    clearPreview,
    hasPreview,
  } = useHomeHeroTheme();

  const [hexInput, setHexInput] = useState(theme.heroHex);
  const [hsv, setHsv] = useState<HsvColor>(() => hexToHsv(theme.heroHex) ?? { h: 212, s: 76, v: 45 });
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setHexInput(theme.heroHex);
    const next = hexToHsv(theme.heroHex);
    if (next) setHsv(next);
  }, [theme.heroHex]);

  const applyHex = useCallback(
    (hex: string) => {
      const normalized = normalizeHex(hex);
      if (!normalized) return;
      setPreviewHeroHex(normalized);
      setHexInput(normalized);
      const nextHsv = hexToHsv(normalized);
      if (nextHsv) setHsv(nextHsv);
    },
    [setPreviewHeroHex]
  );

  const onHsvChange = useCallback(
    (next: HsvColor) => {
      setHsv(next);
      applyHex(hsvToHex(next));
    },
    [applyHex]
  );

  const onHexInputBlur = () => {
    const normalized = normalizeHex(hexInput);
    if (normalized) applyHex(normalized);
    else setHexInput(theme.heroHex);
  };

  const onResetPreview = () => {
    setPreviewHeroHex(DEFAULT_HOME_HERO_THEME.heroHex);
    setPreviewOverlayEnabled(DEFAULT_HOME_HERO_THEME.overlayEnabled);
    setApplyError(null);
  };

  const onApplySiteWide = async () => {
    if (!user) return;
    setApplying(true);
    setApplyError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/home-theme", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ heroHex: theme.heroHex, overlayEnabled: theme.overlayEnabled }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setApplyError(data.message ?? t("home.colorPicker.applyFailed"));
        return;
      }
      clearPreview();
    } catch {
      setApplyError(t("home.colorPicker.applyFailed"));
    } finally {
      setApplying(false);
    }
  };

  const copyHex = async () => {
    try {
      await navigator.clipboard.writeText(theme.heroHex);
    } catch {
      /* ignore */
    }
  };

  if (!checked || !isAdmin || pathname !== "/") return null;

  const rgbTuple = hexToRgbTuple(theme.heroHex);

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[min(100vw-2rem,320px)] rounded-xl border border-white/15 bg-[#1a1a1a] shadow-2xl text-white"
      role="region"
      aria-label={t("home.colorPicker.title")}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10">
        <p className="text-xs font-semibold text-white/90">{t("home.colorPicker.title")}</p>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="text-xs text-white/60 hover:text-white px-2 py-1"
          aria-expanded={!collapsed}
        >
          {collapsed ? t("home.colorPicker.expand") : t("home.colorPicker.collapse")}
        </button>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3">
          <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 cursor-pointer hover:bg-white/[0.04]">
            <span className="text-xs text-white/80">
              {overlayEnabled ? t("home.colorPicker.overlayOn") : t("home.colorPicker.noOverlay")}
            </span>
            <input
              type="checkbox"
              checked={overlayEnabled}
              onChange={(e) => setPreviewOverlayEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-white/30 bg-white/10 accent-sky-500"
            />
          </label>

          <div className={`flex gap-3 ${overlayEnabled ? "" : "opacity-40 pointer-events-none"}`}>
            <div
              className="w-10 shrink-0 rounded-md border border-white/20"
              style={{ backgroundColor: theme.heroHex }}
              aria-hidden
            />
            <div className="min-w-0 flex-1 admin-home-color-picker">
              <HsvColorPicker color={hsv} onChange={onHsvChange} />
            </div>
          </div>

          <div className={`flex items-center gap-2 ${overlayEnabled ? "" : "opacity-40 pointer-events-none"}`}>
            <label className="text-[10px] uppercase tracking-wider text-white/50 shrink-0">
              HEX
            </label>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onBlur={onHexInputBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") onHexInputBlur();
              }}
              disabled={!overlayEnabled}
              className="flex-1 min-w-0 rounded-md bg-white/10 border border-white/15 px-2 py-1.5 text-sm font-mono uppercase disabled:opacity-60"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => void copyHex()}
              disabled={!overlayEnabled}
              className="shrink-0 text-xs text-white/60 hover:text-white px-2 py-1.5 rounded-md hover:bg-white/10 disabled:opacity-60"
              title={t("home.colorPicker.copyHex")}
            >
              {t("home.colorPicker.copy")}
            </button>
          </div>

          {rgbTuple && overlayEnabled && (
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="rounded-md bg-white/5 px-2 py-1.5">
                <p className="text-white/45 uppercase mb-0.5">RGB</p>
                <p className="font-mono text-white/85">{formatRgb(rgbTuple)}</p>
              </div>
              <div className="rounded-md bg-white/5 px-2 py-1.5">
                <p className="text-white/45 uppercase mb-0.5">HSV</p>
                <p className="font-mono text-white/85">{formatHsv(theme.heroHex)}</p>
              </div>
              <div className="rounded-md bg-white/5 px-2 py-1.5">
                <p className="text-white/45 uppercase mb-0.5">HSL</p>
                <p className="font-mono text-white/85">{formatHsl(theme.heroHex)}</p>
              </div>
            </div>
          )}

          {hasPreview && (
            <p className="text-[10px] text-amber-400/90">{t("home.colorPicker.previewHint")}</p>
          )}

          {applyError && <p className="text-xs text-red-400">{applyError}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onResetPreview}
              className="flex-1 min-w-[7rem] rounded-lg border border-white/20 px-3 py-2 text-xs font-medium hover:bg-white/10 transition"
            >
              {t("home.colorPicker.resetDefault")}
            </button>
            <button
              type="button"
              onClick={() => void onApplySiteWide()}
              disabled={applying}
              className="flex-1 min-w-[7rem] rounded-lg bg-[#256195] hover:bg-[#2d6fa8] disabled:opacity-50 px-3 py-2 text-xs font-semibold transition"
            >
              {applying ? t("home.colorPicker.applying") : t("home.colorPicker.applySiteWide")}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .admin-home-color-picker .react-colorful {
          width: 100%;
          height: 140px;
        }
        .admin-home-color-picker .react-colorful__saturation {
          border-radius: 6px 6px 0 0;
        }
        .admin-home-color-picker .react-colorful__hue {
          height: 12px;
          border-radius: 0 0 6px 6px;
        }
        .admin-home-color-picker .react-colorful__pointer {
          width: 14px;
          height: 14px;
        }
      `}</style>
    </div>
  );
}
