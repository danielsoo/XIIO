"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AspectRatioPicker from "@/components/uploader/AspectRatioPicker";
import PlaybackVideo from "@/components/PlaybackVideo";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatUploadApiError, type UploadApiErrorBody } from "@/lib/uploadErrors";
import { defaultAspectRatioForSection } from "@/lib/works/aspect-ratio";
import { parseTagsFromInput } from "@/lib/works/label-utils";
import type { WorkDoc, WorkPendingRevision } from "@/types/work";
import { WORK_SECTIONS, type VideoAspectRatio, type WorkSection } from "@/types/work";

export default function WorkRevisionEditorContent({ workId }: { workId: string }) {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslations();
  const [work, setWork] = useState<(WorkDoc & { id: string }) | null>(null);
  const [livePlayback, setLivePlayback] = useState<string | undefined>();
  const [revisionPlayback, setRevisionPlayback] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [section, setSection] = useState<WorkSection>("movies");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [contentCategory, setContentCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [director, setDirector] = useState("");
  const [description, setDescription] = useState("");

  const applyWork = (w: WorkDoc & { id: string }, rev?: WorkPendingRevision) => {
    setWork(w);
    setTitle(rev?.title ?? w.title);
    setSection(rev?.section ?? w.section);
    setAspectRatio(rev?.proposedAspectRatio ?? w.approvedAspectRatio ?? w.proposedAspectRatio ?? "16:9");
    setContentCategory(rev?.proposedCategory ?? w.approvedCategory ?? w.proposedCategory ?? "");
    setTagsInput((rev?.proposedTags ?? w.approvedTags ?? w.proposedTags ?? []).join(", "));
    setDirector(rev?.director ?? w.director ?? "");
    setDescription(rev?.description ?? w.description ?? "");
  };

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/me/works/${workId}/revision`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as {
        work?: WorkDoc & { id: string };
        livePlayback?: string;
        revisionPlayback?: string;
        message?: string;
      };
      if (!res.ok) {
        setErr(json.message ?? `HTTP ${res.status}`);
        return;
      }
      if (json.work) applyWork(json.work, json.work.pendingRevision);
      setLivePlayback(json.livePlayback);
      setRevisionPlayback(json.revisionPlayback);
    } catch {
      setErr(t("myWorks.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }, [user, workId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const rev = work?.pendingRevision;
    if (!rev?.streamUid || rev.streamStatus === "ready" || rev.streamStatus === "error") return;
    const id = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(id);
  }, [work?.pendingRevision?.streamStatus, work?.pendingRevision?.streamUid, load]);

  useEffect(() => {
    setAspectRatio(defaultAspectRatioForSection(section));
  }, [section]);

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

  const saveMetadata = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await authFetch(`/api/me/works/${workId}/revision`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          section,
          aspectRatio,
          contentCategory: contentCategory.trim() || undefined,
          tags: parseTagsFromInput(tagsInput),
          director: director || undefined,
          description,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setErr(body.message ?? t("myWorks.errorGeneric"));
        return;
      }
      setMsg(t("workRevision.metadataSaved"));
      await load();
    } catch {
      setErr(t("myWorks.errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const uploadNewVideo = async (file: File) => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const sessionRes = await authFetch(`/api/me/works/${workId}/revision/video`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const sessionData = (await sessionRes.json().catch(() => ({}))) as UploadApiErrorBody & {
        uploadURL?: string;
      };
      if (!sessionRes.ok) {
        setErr(formatUploadApiError(t, sessionRes.status, sessionData));
        return;
      }
      if (!sessionData.uploadURL) {
        setErr(t("uploader.errorNoUploadUrl"));
        return;
      }
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch(sessionData.uploadURL, { method: "POST", body: form });
      if (!uploadRes.ok) {
        setErr(t("uploader.errorStreamFailed"));
        return;
      }
      setMsg(t("workRevision.videoUploading"));
      await load();
    } catch {
      setErr(t("myWorks.errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const submitRevision = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await authFetch(`/api/me/works/${workId}/revision/submit`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setErr(body.message ?? t("myWorks.errorGeneric"));
        return;
      }
      setMsg(t("workRevision.submitted"));
      await load();
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

  if (!user || !work) {
    return (
      <main className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-400">{err ?? t("myWorks.errorGeneric")}</p>
        <Link href="/uploader/works" className="text-xiio-accent hover:underline text-sm">
          {t("workRevision.backToWorks")}
        </Link>
      </main>
    );
  }

  const rev = work.pendingRevision;
  const reviewPending = work.revisionReviewStatus === "pending";
  const reviewRejected = work.revisionReviewStatus === "rejected";
  const revEncoding = Boolean(
    rev?.streamUid && rev.streamStatus !== "ready" && rev.streamStatus !== "error"
  );
  const canSubmit =
    !reviewPending &&
    rev &&
    (rev.platformStatus === "draft" || rev.platformStatus === "rejected") &&
    (!rev.streamUid || rev.streamStatus === "ready");

  return (
    <main className="min-h-screen bg-xiio-bg px-4 py-16 md:px-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/uploader/works" className="text-sm text-xiio-muted hover:text-white mb-6 inline-block">
          ← {t("workRevision.backToWorks")}
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">{t("workRevision.title")}</h1>
        <p className="text-xiio-muted text-sm mb-6">{work.title}</p>

        <p className="mb-4 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sky-100 text-sm">
          {t("workRevision.hint")}
        </p>

        {reviewPending && (
          <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
            {t("workRevision.revisionPending")}
          </p>
        )}
        {reviewRejected && rev?.rejectReason && (
          <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
            {t("workRevision.revisionRejected")} {rev.rejectReason}
          </p>
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

        {livePlayback && (
          <section className="mb-6">
            <p className="text-xs text-xiio-muted mb-2">{t("workRevision.liveLabel")}</p>
            <PlaybackVideo src={livePlayback} />
          </section>
        )}

        {revisionPlayback && (
          <section className="mb-6">
            <p className="text-xs text-xiio-muted mb-2">{t("workRevision.newVideoLabel")}</p>
            <PlaybackVideo src={revisionPlayback} />
          </section>
        )}

        {!reviewPending && (
          <form
            className="space-y-4 rounded-2xl border border-white/10 bg-xiio-surface p-6"
            onSubmit={(e) => {
              e.preventDefault();
              void saveMetadata();
            }}
          >
            <div>
              <label className="block text-sm text-xiio-muted mb-1">{t("uploader.uploadTitleLabel")}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-xiio-muted mb-1">{t("uploader.uploadSectionLabel")}</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value as WorkSection)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
              >
                {WORK_SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {t(`myWorks.section.${s}`)}
                  </option>
                ))}
              </select>
            </div>

            <AspectRatioPicker value={aspectRatio} onChange={setAspectRatio} disabled={Boolean(revEncoding)} />

            <div>
              <label className="block text-sm text-xiio-muted mb-1">{t("uploader.uploadCategoryLabel")}</label>
              <input
                type="text"
                value={contentCategory}
                onChange={(e) => setContentCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-xiio-muted mb-1">{t("uploader.uploadTagsLabel")}</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-xiio-muted mb-1">{t("uploader.uploadDirectorLabel")}</label>
              <input
                type="text"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-xiio-muted mb-1">{t("uploader.uploadDescriptionLabel")}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={busy || revEncoding}
                className="px-4 py-2.5 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white text-sm font-medium disabled:opacity-40"
              >
                {t("workRevision.saveMetadata")}
              </button>
              <label className="px-4 py-2.5 rounded-lg border border-white/15 text-white text-sm hover:bg-white/5 cursor-pointer">
                {t("workRevision.replaceVideo")}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  disabled={busy || revEncoding}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadNewVideo(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </form>
        )}

        {canSubmit && (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <button
              type="button"
              disabled={busy}
              onClick={() => void submitRevision()}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-40"
            >
              {t("workRevision.submitReview")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
