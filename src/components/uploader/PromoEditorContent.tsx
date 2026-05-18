"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import type { PromoShortDoc, WorkDoc } from "@/types/work";

type EditorData = {
  work: WorkDoc & { playbackUrl?: string; durationSec?: number };
  promo: (PromoShortDoc & { id: string; playbackUrl?: string }) | null;
};

export default function PromoEditorContent({ workId }: { workId: string }) {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslations();
  const [data, setData] = useState<EditorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(30);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/me/works/${workId}/promo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as EditorData & { message?: string };
      if (!res.ok) {
        setErr(json.message ?? `HTTP ${res.status}`);
        return;
      }
      setData(json);
      const dur = json.work.durationSec ?? 120;
      const promo = json.promo;
      setClipStart(promo?.clipStartSec ?? 0);
      setClipEnd(promo?.clipEndSec ?? Math.min(30, dur));
      setTitle(promo?.title ?? json.work.title);
      setDescription(promo?.description ?? json.work.description ?? "");
    } catch {
      setErr(t("myWorks.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }, [user, workId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const authFetch = async (url: string, init?: RequestInit) => {
    if (!user) throw new Error("no user");
    const token = await user.getIdToken();
    return fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  };

  const saveClip = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await authFetch(`/api/me/works/${workId}/promo`, {
        method: "PUT",
        body: JSON.stringify({
          clipStartSec: clipStart,
          clipEndSec: clipEnd,
          title,
          description,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setErr(body.message ?? t("myWorks.errorGeneric"));
        return;
      }
      setMsg(t("promoEditor.saved"));
      await load();
    } catch {
      setErr(t("myWorks.errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await authFetch(`/api/me/works/${workId}/promo/submit`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setErr(body.message ?? t("myWorks.errorGeneric"));
        return;
      }
      setMsg(t("promoEditor.submitted"));
      await load();
    } catch {
      setErr(t("myWorks.errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const deletePromo = async () => {
    if (!confirm(t("promoEditor.confirmDelete"))) return;
    setBusy(true);
    try {
      const res = await authFetch(`/api/me/works/${workId}/promo`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setErr(body.message ?? t("myWorks.errorGeneric"));
        return;
      }
      await load();
      setMsg(t("promoEditor.deleted"));
    } catch {
      setErr(t("myWorks.errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
        <p className="text-xiio-muted">{t("common.loading")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4">
        <p className="text-white">{t("myWorks.loginRequired")}</p>
        <Link href="/login" className="text-xiio-accent hover:underline">
          {t("common.login")}
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-400">{err ?? t("myWorks.errorGeneric")}</p>
        <Link href="/uploader/works" className="text-xiio-accent hover:underline text-sm">
          {t("promoEditor.backToWorks")}
        </Link>
      </main>
    );
  }

  const { work, promo } = data;
  const duration = work.durationSec ?? 600;
  const locked =
    promo?.platformStatus === "pending" || promo?.platformStatus === "published";
  const canSubmit =
    promo &&
    (promo.platformStatus === "draft" || promo.platformStatus === "rejected") &&
    promo.streamStatus === "ready";

  return (
    <main className="min-h-screen bg-xiio-bg px-4 py-16 md:px-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/uploader/works" className="text-sm text-xiio-muted hover:text-white mb-6 inline-block">
          ← {t("promoEditor.backToWorks")}
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">{t("promoEditor.title")}</h1>
        <p className="text-xiio-muted text-sm mb-6">{work.title}</p>

        {work.streamStatus !== "ready" && (
          <p className="mb-4 text-amber-400 text-sm">{t("promoEditor.waitEncoding")}</p>
        )}

        {msg && (
          <div className="mb-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-emerald-400 text-sm">
            {msg}
          </div>
        )}
        {err && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-400 text-sm">
            {err}
          </div>
        )}

        {work.playbackUrl && (
          <div className="mb-6 rounded-xl overflow-hidden bg-black aspect-video">
            <video src={work.playbackUrl} controls className="w-full h-full" playsInline />
          </div>
        )}

        <div className="space-y-4 rounded-2xl border border-white/10 bg-xiio-surface p-6">
          <p className="text-sm text-xiio-muted">{t("promoEditor.clipHint")}</p>

          <div>
            <label className="block text-sm text-xiio-muted mb-1">
              {t("promoEditor.clipStart")} ({clipStart.toFixed(1)}s)
            </label>
            <input
              type="range"
              min={0}
              max={Math.max(0, duration - 3)}
              step={0.5}
              value={clipStart}
              disabled={locked || work.streamStatus !== "ready"}
              onChange={(e) => {
                const v = Number(e.target.value);
                setClipStart(v);
                if (clipEnd <= v + 3) setClipEnd(Math.min(v + 30, duration));
              }}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-xiio-muted mb-1">
              {t("promoEditor.clipEnd")} ({clipEnd.toFixed(1)}s) —{" "}
              {t("promoEditor.clipDuration", { sec: (clipEnd - clipStart).toFixed(1) })}
            </label>
            <input
              type="range"
              min={clipStart + 3}
              max={Math.min(duration, clipStart + 120)}
              step={0.5}
              value={clipEnd}
              disabled={locked || work.streamStatus !== "ready"}
              onChange={(e) => setClipEnd(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-xiio-muted mb-1">{t("promoEditor.promoTitle")}</label>
            <input
              type="text"
              value={title}
              disabled={locked}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm text-xiio-muted mb-1">{t("promoEditor.promoDescription")}</label>
            <textarea
              value={description}
              disabled={locked}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white disabled:opacity-50 resize-none"
            />
          </div>

          {promo?.playbackUrl && promo.streamStatus === "ready" && (
            <div>
              <p className="text-sm text-xiio-muted mb-2">{t("promoEditor.preview")}</p>
              <video src={promo.playbackUrl} controls className="w-full rounded-lg" playsInline />
            </div>
          )}

          {promo && (
            <p className="text-xs text-xiio-muted">
              {t(`myWorks.promoStatus.${promo.platformStatus}`)} ·{" "}
              {t(`myWorks.stream.${promo.streamStatus ?? "processing"}`)}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {!locked && work.streamStatus === "ready" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveClip()}
                className="px-4 py-2 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white text-sm font-medium disabled:opacity-40"
              >
                {busy ? t("common.processing") : t("promoEditor.saveClip")}
              </button>
            )}
            {canSubmit && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitReview()}
                className="px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-400 text-sm hover:bg-emerald-500/10 disabled:opacity-40"
              >
                {t("promoEditor.submitReview")}
              </button>
            )}
            {promo &&
              (promo.platformStatus === "draft" || promo.platformStatus === "rejected") && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void deletePromo()}
                  className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 disabled:opacity-40"
                >
                  {t("promoEditor.deletePromo")}
                </button>
              )}
          </div>
        </div>
      </div>
    </main>
  );
}
