"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PromoShortFields from "@/components/uploader/PromoShortFields";
import UploaderFormShell from "@/components/uploader/UploaderFormShell";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import PlaybackVideo from "@/components/PlaybackVideo";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";
import type {
  PromoPendingRevision,
  PromoShortDoc,
  RevisionReviewStatus,
  StreamStatus,
  WorkDoc,
} from "@/types/work";

type EditorData = {
  work: WorkDoc & { playbackUrl?: string; durationSec?: number };
  promo: (PromoShortDoc & { id: string; playbackUrl?: string }) | null;
  revisionMode?: boolean;
  revisionReviewStatus?: RevisionReviewStatus;
  pendingRevision?: PromoPendingRevision | null;
  pendingRevisionPlayback?: string;
};

function isPromoEncoding(status: StreamStatus | undefined): boolean {
  return status === "uploading" || status === "processing";
}

export default function PromoEditorContent({ workId }: { workId: string }) {
  const searchParams = useSearchParams();
  const justUploaded = searchParams.get("uploaded") === "1";
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslations();
  const [data, setData] = useState<EditorData | null>(null);
  const [revisionMode, setRevisionMode] = useState(false);
  const [revisionReviewStatus, setRevisionReviewStatus] = useState<RevisionReviewStatus | undefined>();
  const [pendingRevisionPlayback, setPendingRevisionPlayback] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [justSavedClip, setJustSavedClip] = useState(false);

  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(30);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!user) return;
    if (!opts?.silent) {
      setLoading(true);
      setErr(null);
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/me/works/${workId}/promo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data: json, raw } = await readResponseJson<EditorData & { message?: string; error?: string }>(res);
      if (!res.ok) {
        if (!opts?.silent) {
          setErr(formatApiError(t, res.status, { ...json, message: json.message ?? raw.slice(0, 500) }));
        }
        return;
      }
      setData(json);
      setRevisionMode(Boolean(json.revisionMode));
      setRevisionReviewStatus(json.revisionReviewStatus);
      setPendingRevisionPlayback(json.pendingRevisionPlayback);
      const dur = json.work.durationSec ?? 120;
      const promo = json.promo;
      const rev = json.pendingRevision;
      const source = json.revisionMode && rev ? rev : promo;
      const draft = json.work.promoDraft;
      setClipStart(
        source?.clipStartSec ?? promo?.clipStartSec ?? draft?.clipStartSec ?? 0
      );
      setClipEnd(
        source?.clipEndSec ?? promo?.clipEndSec ?? draft?.clipEndSec ?? Math.min(30, dur)
      );
      setTitle(source?.title ?? promo?.title ?? draft?.title ?? json.work.title);
      setDescription(
        source?.description ?? promo?.description ?? draft?.description ?? json.work.description ?? ""
      );
      const encStatus = json.revisionMode ? rev?.streamStatus : promo?.streamStatus;
      if (encStatus && !isPromoEncoding(encStatus) && encStatus === "ready") {
        setJustSavedClip(false);
        if (opts?.silent) {
          setMsg(t("promoEditor.statusReadyBody"));
        }
      }
    } catch (e) {
      if (!opts?.silent) setErr(formatClientError(t, e, { titleKey: "myWorks.errorGeneric" }));
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [user, workId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const promo = data?.promo;
  const pendingRevision = data?.pendingRevision;
  const activeStreamStatus = revisionMode ? pendingRevision?.streamStatus : promo?.streamStatus;
  const promoEncoding = activeStreamStatus ? isPromoEncoding(activeStreamStatus) : false;

  useEffect(() => {
    if (!user || !data) return;
    const work = data.work;
    const enc = revisionMode ? pendingRevision?.streamStatus : promo?.streamStatus;
    const needsPoll =
      work.streamStatus !== "ready" ||
      (!promo && work.promoDraft) ||
      (enc ? isPromoEncoding(enc) : false);
    if (!needsPoll) return;
    const id = window.setInterval(() => void load({ silent: true }), 5000);
    return () => window.clearInterval(id);
  }, [user, data, load, revisionMode, promo, pendingRevision]);

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
      const { data: body, raw } = await readResponseJson<{ message?: string; error?: string }>(res);
      if (!res.ok) {
        setErr(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
      setJustSavedClip(true);
      setMsg(t("promoEditor.savedEncoding"));
      await load({ silent: true });
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "myWorks.errorGeneric" }));
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await authFetch(`/api/me/works/${workId}/promo/submit`, { method: "POST" });
      const { data: body, raw } = await readResponseJson<{ message?: string; error?: string }>(res);
      if (!res.ok) {
        setErr(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
      setMsg(t("promoEditor.submitted"));
      setJustSavedClip(false);
      await load();
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "myWorks.errorGeneric" }));
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
        const { data: body, raw } = await readResponseJson<{ message?: string; error?: string }>(res);
        setErr(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
      setJustSavedClip(false);
      setMsg(null);
      await load();
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "myWorks.errorGeneric" }));
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

  const { work } = data;
  const duration = work.durationSec ?? 600;
  const locked = revisionMode
    ? revisionReviewStatus === "pending"
    : promo?.platformStatus === "pending" || promo?.platformStatus === "published";
  const fullReady = work.streamStatus === "ready";
  const canSubmit = revisionMode
    ? Boolean(
        pendingRevision &&
          (pendingRevision.platformStatus === "draft" || pendingRevision.platformStatus === "rejected") &&
          pendingRevision.streamStatus === "ready"
      )
    : Boolean(
        promo &&
          (promo.platformStatus === "draft" || promo.platformStatus === "rejected") &&
          promo.streamStatus === "ready"
      );
  const awaitingAutoPromo = !promo && Boolean(work.promoDraft);
  const showEditor =
    fullReady && !locked && !promoEncoding && !awaitingAutoPromo &&
    (revisionMode || !promo || promo.platformStatus === "draft" || promo.platformStatus === "rejected");
  const savedClip = revisionMode
    ? Boolean(
        pendingRevision &&
          (promoEncoding ||
            justSavedClip ||
            pendingRevision.platformStatus === "draft" ||
            pendingRevision.platformStatus === "rejected")
      )
    : Boolean(
        promo &&
          (promoEncoding ||
            justSavedClip ||
            promo.platformStatus === "draft" ||
            promo.platformStatus === "rejected")
      );

  const leftColumn = (
    <>
      {work.playbackUrl ? (
        <div>
          <p className="text-xs text-xiio-muted mb-2">{t("promoEditor.fullVideoLabel")}</p>
          <PlaybackVideo src={work.playbackUrl} maxHeightClass="max-h-[min(52vh,520px)]" />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] min-h-[280px] lg:min-h-[360px] flex items-center justify-center p-6 text-center">
          <p className="text-sm text-xiio-muted">{t("promoEditor.waitEncoding")}</p>
        </div>
      )}
      {((revisionMode && pendingRevisionPlayback) ||
        (!revisionMode && promo?.playbackUrl && promo.streamStatus === "ready")) && (
        <div className="mt-6">
          <p className="text-sm text-xiio-muted mb-2">{t("promoEditor.preview")}</p>
          <PlaybackVideo
            src={revisionMode ? pendingRevisionPlayback! : promo!.playbackUrl!}
            maxHeightClass="max-h-[min(52vh,520px)]"
          />
        </div>
      )}
    </>
  );

  const rightColumn = (
    <>
      {awaitingAutoPromo && (
        <div className="rounded-xl border border-xiio-accent/30 bg-xiio-accent/10 px-4 py-3 text-sm text-white/90">
          {t("promoEditor.awaitingAutoPromo")}
        </div>
      )}

      {savedClip && (revisionMode ? pendingRevision : promo) && (
        <section className="rounded-2xl border border-xiio-accent/30 bg-xiio-accent/10 p-5">
          <div className="flex items-start gap-3">
            {promoEncoding && (
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                <span className="h-4 w-4 rounded-full border-2 border-xiio-accent border-t-transparent animate-spin" />
              </span>
            )}
            {!promoEncoding && activeStreamStatus === "ready" && (
              <span className="mt-0.5 text-emerald-400 text-lg" aria-hidden>
                ✓
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-white font-semibold text-sm mb-1">
                {promoEncoding
                  ? t("promoEditor.savedClipEncoding")
                  : t("promoEditor.savedClipReady")}
              </h2>
              <ul className="text-sm text-white/80 space-y-1">
                <li>
                  {t("promoEditor.clipRange", {
                    start: (revisionMode && pendingRevision
                      ? pendingRevision.clipStartSec
                      : promo!.clipStartSec
                    ).toFixed(1),
                    end: (revisionMode && pendingRevision
                      ? pendingRevision.clipEndSec
                      : promo!.clipEndSec
                    ).toFixed(1),
                    sec: (
                      revisionMode && pendingRevision
                        ? pendingRevision.clipEndSec - pendingRevision.clipStartSec
                        : promo!.clipEndSec - promo!.clipStartSec
                    ).toFixed(1),
                  })}
                </li>
                <li>{revisionMode && pendingRevision ? pendingRevision.title : promo!.title}</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {showEditor && (
        <div className="rounded-2xl border border-white/10 bg-xiio-surface p-6">
          <PromoShortFields
            duration={duration}
            clipStart={clipStart}
            clipEnd={clipEnd}
            onClipStartChange={setClipStart}
            onClipEndChange={setClipEnd}
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            disabled={busy}
            hideClipSliders={!fullReady}
          />
          <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-white/10">
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveClip()}
              className="px-4 py-2.5 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white text-sm font-medium disabled:opacity-40"
            >
              {busy ? t("common.processing") : t("promoEditor.saveClip")}
            </button>
            {promo && (promo.platformStatus === "draft" || promo.platformStatus === "rejected") && (
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
      )}

      {promoEncoding && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="px-4 py-2.5 rounded-lg bg-white/10 text-xiio-muted text-sm font-medium cursor-not-allowed"
          >
            {t("promoEditor.encodingButton")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void load({ silent: true })}
            className="px-4 py-2 rounded-lg border border-white/15 text-white text-sm hover:bg-white/5 disabled:opacity-40"
          >
            {t("promoEditor.refreshStatus")}
          </button>
        </div>
      )}
    </>
  );

  return (
    <main className="min-h-screen bg-xiio-bg px-4 py-16 md:px-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/uploader/works" className="text-sm text-xiio-muted hover:text-white mb-6 inline-block">
          ← {t("promoEditor.backToWorks")}
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">{t("promoEditor.title")}</h1>
        <p className="text-xiio-muted text-sm mb-6">{work.title}</p>

        <UploaderFormShell
          banners={
            <>
              {justUploaded && (
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sky-100 text-sm">
                  {t("promoEditor.uploadedHint")}
                </div>
              )}
              {revisionMode && (
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sky-100 text-sm">
                  {t("promoEditor.revisionModeHint")}
                </div>
              )}
              {revisionMode && revisionReviewStatus === "pending" && (
                <PromoStatusBanner
                  variant="pending"
                  title={t("promoEditor.revisionPendingTitle")}
                  body={t("promoEditor.revisionPendingBody")}
                />
              )}
              {!fullReady && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-300 text-sm">
                  {t("promoEditor.waitEncoding")}
                </div>
              )}
              {awaitingAutoPromo && fullReady && (
                <PromoStatusBanner
                  variant="encoding"
                  title={t("promoEditor.creatingPromoTitle")}
                  body={t("promoEditor.creatingPromoBody")}
                />
              )}
              {promoEncoding && (
                <PromoStatusBanner
                  variant="encoding"
                  title={t("promoEditor.statusEncodingTitle")}
                  body={t("promoEditor.statusEncodingBody")}
                />
              )}
              {!promoEncoding && promo?.streamStatus === "ready" && promo.platformStatus === "draft" && (
                <PromoStatusBanner
                  variant="ready"
                  title={t("promoEditor.statusReadyTitle")}
                  body={t("promoEditor.statusReadyBody")}
                />
              )}
              {!revisionMode && !promoEncoding && promo?.platformStatus === "pending" && (
                <PromoStatusBanner
                  variant="pending"
                  title={t("promoEditor.statusPendingTitle")}
                  body={t("promoEditor.statusPendingBody")}
                />
              )}
              {msg && !promoEncoding && (
                <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-emerald-400 text-sm">
                  {msg}
                </div>
              )}
              {err && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-400 text-sm whitespace-pre-wrap break-words">
                  {err}
                </div>
              )}
            </>
          }
          left={leftColumn}
          right={rightColumn}
          footer={
            canSubmit ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <p className="text-sm text-emerald-300/90 mb-3">{t("promoEditor.submitHint")}</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submitReview()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-40"
                >
                  {busy ? t("common.processing") : t("promoEditor.submitReview")}
                </button>
              </div>
            ) : null
          }
        />
      </div>
    </main>
  );
}

function PromoStatusBanner({
  variant,
  title,
  body,
}: {
  variant: "encoding" | "ready" | "pending";
  title: string;
  body: string;
}) {
  const styles = {
    encoding: "border-xiio-accent/40 bg-xiio-accent/10 text-white",
    ready: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
    pending: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  };

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 ${styles[variant]}`}>
      <p className="font-semibold text-sm mb-0.5">{title}</p>
      <p className="text-sm opacity-90">{body}</p>
    </div>
  );
}
