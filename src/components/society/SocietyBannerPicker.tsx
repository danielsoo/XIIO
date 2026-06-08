"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import {
  HERO_BACKGROUND_PRESETS,
  type HeroBackgroundId,
} from "@/lib/heroBackgroundPresets";
import { SOCIETY_BANNER_IDS } from "@/lib/societyBannerBackground";

type Props = {
  value: HeroBackgroundId;
  onChange: (id: HeroBackgroundId) => void;
};

export default function SocietyBannerPicker({ value, onChange }: Props) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const select = async (id: HeroBackgroundId) => {
    if (!user || busy || id === value) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/me/professional-profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ societyBannerBackgroundId: id }),
      });
      if (!res.ok) {
        setErr(t("society.hero.bannerSaveError"));
        return;
      }
      onChange(id);
      setMsg(t("society.hero.bannerSaved"));
      setOpen(false);
    } catch {
      setErr(t("society.hero.bannerSaveError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setMsg(null);
          setErr(null);
        }}
        disabled={busy}
        className="rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm transition hover:border-white/35 hover:bg-black/55 sm:text-sm"
      >
        {t("society.hero.changeBanner")}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-[min(100vw-2rem,320px)] rounded-xl border border-white/15 bg-[#0a0e14]/95 p-3 shadow-xl backdrop-blur-md">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SOCIETY_BANNER_IDS.map((id) => {
              const preset = HERO_BACKGROUND_PRESETS[id];
              const active = id === value;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={busy}
                  onClick={() => void select(id)}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border transition ${
                    active
                      ? "border-xiio-accent ring-2 ring-xiio-accent/40"
                      : "border-white/15 hover:border-white/30"
                  }`}
                  aria-pressed={active}
                  aria-label={id}
                >
                  <Image
                    src={preset.src}
                    alt=""
                    fill
                    className="object-cover"
                    style={{ objectPosition: preset.objectPosition }}
                    sizes="80px"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {msg ? <p className="mt-1 text-right text-xs text-emerald-400">{msg}</p> : null}
      {err ? <p className="mt-1 text-right text-xs text-red-400">{err}</p> : null}
    </div>
  );
}
