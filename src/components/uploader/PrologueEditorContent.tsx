"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import UploaderHeaderActions from "@/components/uploader/UploaderHeaderActions";
import UploadWizardStepper, {
  type UploadWizardStepMeta,
} from "@/components/uploader/UploadWizardStepper";
import UploaderFormSection from "@/components/uploader/UploaderFormSection";
import UploaderFormShell from "@/components/uploader/UploaderFormShell";
import VideoUploadDropzone from "@/components/uploader/VideoUploadDropzone";
import PlaybackVideo from "@/components/PlaybackVideo";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useVideoFileMetadata } from "@/hooks/useVideoFileMetadata";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";
import { uploadFileViaTus } from "@/lib/streamTusUpload";
import { aspectRatioMessageKey } from "@/lib/works/aspect-ratio";
import { getPrologueFileValidationError } from "@/lib/works/prologue-file-validation";
import { resolveDisplayTitle } from "@/lib/works/display-title";
import { isStreamEncoding } from "@/lib/works/work-staging-ready";
import type {
  PrologueShortDoc,
  RevisionReviewStatus,
  WorkDoc,
} from "@/types/work";

type EditorData = {
  work: WorkDoc & { playbackUrl?: string };
  prologue: (PrologueShortDoc & { id: string; playbackUrl?: string }) | null;
  revisionMode?: boolean;
  revisionReviewStatus?: RevisionReviewStatus;
  pendingRevision?: PrologueShortDoc["pendingRevision"];
  pendingRevisionPlayback?: string;
};

type StepId = "video" | "info" | "preview";

const STEPS: StepId[] = ["video", "info", "preview"];

const STEP_META: UploadWizardStepMeta[] = [
  { id: "video", titleKey: "prologueEditor.stepVideoTitle", hintKey: "prologueEditor.stepVideoHint" },
  { id: "info", titleKey: "prologueEditor.stepInfoTitle", hintKey: "prologueEditor.stepInfoHint" },
  { id: "preview", titleKey: "prologueEditor.stepPreviewTitle", hintKey: "prologueEditor.stepPreviewHint" },
];

export default function PrologueEditorContent({ workId }: { workId: string }) {
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
  const [prologueFile, setPrologueFile] = useState<File | null>(null);
  const prologueMeta = useVideoFileMetadata(prologueFile);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const stepInitRef = useRef<string | null>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!user) return;
      if (!opts?.silent) {
        setLoading(true);
        setErr(null);
      }
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/me/works/${workId}/prologue`, {
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
        const p = json.prologue;
        const rev = json.pendingRevision;
        const source = json.revisionMode && rev ? rev : p;
        const draft = json.work.prologueDraft;
        setTitle(
          resolveDisplayTitle(
            t("common.untitled"),
            source?.title,
            p?.title,
            draft?.title,
            json.work.title
          )
        );
        setDescription(
          source?.description ?? p?.description ?? draft?.description ?? json.work.description ?? ""
        );
        const encStatus = json.revisionMode ? rev?.streamStatus : p?.streamStatus;
        if (encStatus && !isStreamEncoding(encStatus) && encStatus === "ready" && opts?.silent) {
          setMsg(t("prologueEditor.statusReadyBody"));
        }
      } catch (e) {
        if (!opts?.silent) setErr(formatClientError(t, e, { titleKey: "myWorks.errorGeneric" }));
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [user, workId, t]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    stepInitRef.current = null;
  }, [workId]);

  useEffect(() => {
    if (loading || !data) return;
    if (stepInitRef.current === workId) return;
    stepInitRef.current = workId;
    const p = data.prologue;
    const rev = data.pendingRevision;
    const hasVideo = data.revisionMode ? Boolean(rev?.streamUid) : Boolean(p?.streamUid);
    setStepIndex(hasVideo ? 1 : 0);
  }, [loading, data, workId]);

  useEffect(() => {
    if (!user || !data) return;
    const p = data.prologue;
    const rev = data.pendingRevision;
    const enc = revisionMode ? rev?.streamStatus : p?.streamStatus;
    if (!enc || !isStreamEncoding(enc)) return;
    const id = window.setInterval(() => void load({ silent: true }), 5000);
    return () => window.clearInterval(id);
  }, [user, data, load, revisionMode]);

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

  const uploadPrologueVideo = async () => {
    if (!prologueFile || !user) return;
    const fileErr = getPrologueFileValidationError(true, prologueMeta);
    if (fileErr === "loading") {
      setErr(t("uploader.errorPrologueVideoLoading"));
      return;
    }
    if (fileErr) {
      setErr(t("uploader.errorPrologueVideoInvalid"));
      return;
    }

    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await authFetch(`/api/me/works/${workId}/prologue/upload-url`, {
        method: "POST",
        body: JSON.stringify({
          uploadLength: prologueFile.size,
          revision: revisionMode,
        }),
      });
      const { data: body, raw } = await readResponseJson<{ tusEndpoint?: string; message?: string; error?: string }>(
        res
      );
      if (!res.ok || !body.tusEndpoint) {
        setErr(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
      await uploadFileViaTus(prologueFile, body.tusEndpoint);
      setPrologueFile(null);
      setMsg(t("prologueEditor.savedEncoding"));
      await load({ silent: true });
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "myWorks.errorGeneric" }));
    } finally {
      setBusy(false);
    }
  };

  const saveMeta = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await authFetch(`/api/me/works/${workId}/prologue`, {
        method: "PUT",
        body: JSON.stringify({ title, description }),
      });
      const { data: body, raw } = await readResponseJson<{ message?: string; error?: string }>(res);
      if (!res.ok) {
        setErr(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
      setMsg(t("prologueEditor.metaSaved"));
      await load({ silent: true });
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "myWorks.errorGeneric" }));
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async () => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await authFetch(`/api/me/works/${workId}/prologue/submit`, { method: "POST" });
      const { data: body, raw } = await readResponseJson<{ message?: string; error?: string }>(res);
      if (!res.ok) {
        setErr(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
      setMsg(t("prologueEditor.submitted"));
      await load();
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "myWorks.errorGeneric" }));
    } finally {
      setBusy(false);
    }
  };

  const deletePrologue = async () => {
    if (!confirm(t("prologueEditor.confirmDelete"))) return;
    setBusy(true);
    try {
      const res = await authFetch(`/api/me/works/${workId}/prologue`, { method: "DELETE" });
      if (!res.ok) {
        const { data: body, raw } = await readResponseJson<{ message?: string; error?: string }>(res);
        setErr(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
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
      <AppPageShell>
        <p className="text-red-400">{err ?? t("myWorks.errorGeneric")}</p>
        <Link href="/uploader/works" className="text-xiio-accent text-sm mt-4 inline-block">
          {t("prologueEditor.backToWorks")}
        </Link>
      </AppPageShell>
    );
  }

  const { work, prologue } = data;
  const workPublished = work.platformStatus === "published";
  if (!workPublished && !prologue) {
    return (
      <AppPageShell>
        <SubpageHeader title={t("prologueEditor.title")} backFallbackHref="/uploader/works" endContent={<UploaderHeaderActions area="prologue-editor" />} />
        <p className="text-xiio-muted">{t("prologueEditor.workNotPublished")}</p>
        <Link href="/uploader/works" className="text-xiio-accent text-sm mt-4 inline-block">
          {t("prologueEditor.backToWorks")}
        </Link>
      </AppPageShell>
    );
  }

  const pendingRevision = data.pendingRevision;
  const active = revisionMode && pendingRevision ? pendingRevision : prologue;
  const encoding = isStreamEncoding(active?.streamStatus);
  const locked = revisionMode
    ? revisionReviewStatus === "pending"
    : prologue?.platformStatus === "pending";
  const playbackUrl =
    revisionMode && pendingRevisionPlayback
      ? pendingRevisionPlayback
      : prologue?.playbackUrl;
  const canSubmit =
    !locked &&
    (revisionMode
      ? Boolean(
          pendingRevision &&
            (pendingRevision.platformStatus === "draft" ||
              pendingRevision.platformStatus === "rejected") &&
            pendingRevision.streamStatus === "ready"
        )
      : Boolean(
          prologue &&
            (prologue.platformStatus === "draft" || prologue.platformStatus === "rejected") &&
            prologue.streamStatus === "ready"
        ));
  const ratio = work.approvedAspectRatio ?? work.proposedAspectRatio ?? "16:9";
  const fileErr = getPrologueFileValidationError(Boolean(prologueFile), prologueMeta);
  const stepId = STEPS[stepIndex] ?? "video";

  return (
    <AppPageShell>
      <SubpageHeader
        title={t("prologueEditor.title")}
        backHref="/uploader/works"
        backLabel={t("prologueEditor.backToWorks")}
        backFallbackHref="/uploader/works"
        endContent={<UploaderHeaderActions area="prologue-editor" />}
      />
      <p className="text-sm text-xiio-muted mb-4">
        {resolveDisplayTitle(t("common.untitled"), work.title)} ·{" "}
        {t(aspectRatioMessageKey(ratio))}
      </p>

      {err && <p className="text-red-400 text-sm mb-4 whitespace-pre-wrap">{err}</p>}
      {msg && <p className="text-emerald-400 text-sm mb-4">{msg}</p>}

      <UploadWizardStepper
        steps={STEP_META}
        currentIndex={stepIndex}
        onStepClick={(i) => setStepIndex(i)}
      />

      <UploaderFormShell layout="stacked">
        {stepId === "video" && (
          <UploaderFormSection title={t("prologueEditor.stepVideoTitle")}>
            {playbackUrl && !encoding ? (
              <div className="mb-4 max-w-lg rounded-xl overflow-hidden border border-white/10">
                <PlaybackVideo src={playbackUrl} maxHeightClass="max-h-[50vh]" />
              </div>
            ) : encoding ? (
              <p className="text-sm text-amber-300 mb-4">{t("prologueEditor.savedEncoding")}</p>
            ) : null}
            {!locked && (
              <>
                <p className="text-sm text-xiio-muted mb-3">
                  {t("uploader.prologueVideoFileHint", { ratio: t(aspectRatioMessageKey(ratio)) })}
                </p>
                <VideoUploadDropzone
                  file={prologueFile}
                  onFileChange={setPrologueFile}
                  disabled={busy}
                />
                <button
                  type="button"
                  disabled={busy || !prologueFile || Boolean(fileErr)}
                  onClick={() => void uploadPrologueVideo()}
                  className="mt-4 px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm disabled:opacity-40"
                >
                  {t("uploader.uploadZonePrologueTitle")}
                </button>
              </>
            )}
            {prologue && !locked && prologue.platformStatus !== "published" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void deletePrologue()}
                className="mt-4 ml-3 px-4 py-2 rounded-lg border border-red-500/40 text-red-300 text-sm"
              >
                {t("prologueEditor.deletePrologue")}
              </button>
            )}
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                disabled={!active?.streamUid && !playbackUrl}
                onClick={() => setStepIndex(1)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm disabled:opacity-40"
              >
                {t("common.next")}

              </button>
            </div>
          </UploaderFormSection>
        )}

        {stepId === "info" && (
          <UploaderFormSection title={t("prologueEditor.stepInfoTitle")}>
            <label className="block text-sm text-xiio-muted mb-1">{t("uploader.prologueTitleLabel")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={locked}
              className="w-full max-w-lg mb-4 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-sm"
            />
            <label className="block text-sm text-xiio-muted mb-1">
              {t("uploader.prologueDescriptionLabel")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={locked}
              rows={4}
              className="w-full max-w-lg mb-4 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-sm"
            />
            {!locked && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveMeta()}
                className="px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm disabled:opacity-40"
              >
                {t("promoEditor.saveMeta")}
              </button>
            )}
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setStepIndex(0)}
                className="px-4 py-2 rounded-lg border border-white/15 text-white text-sm"
              >
                {t("common.previous")}
              </button>
              <button
                type="button"
                onClick={() => setStepIndex(2)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm"
              >
                {t("common.next")}

              </button>
            </div>
          </UploaderFormSection>
        )}

        {stepId === "preview" && (
          <UploaderFormSection title={t("prologueEditor.stepPreviewTitle")}>
            {playbackUrl ? (
              <div className="mb-4 max-w-lg rounded-xl overflow-hidden border border-white/10">
                <PlaybackVideo src={playbackUrl} maxHeightClass="max-h-[50vh]" />
              </div>
            ) : (
              <p className="text-sm text-xiio-muted mb-4">{t("promoEditor.previewEmpty")}</p>
            )}
            {title && <p className="text-white font-medium mb-1">{title}</p>}
            {description && <p className="text-sm text-white/80 whitespace-pre-wrap mb-4">{description}</p>}
            {canSubmit && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitReview()}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-40"
              >
                {t("prologueEditor.submitReview")}
              </button>
            )}
            {locked && prologue?.platformStatus === "pending" && (
              <p className="text-sm text-amber-300 mt-2">{t("myWorks.revisionReviewPending")}</p>
            )}
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setStepIndex(1)}
                className="px-4 py-2 rounded-lg border border-white/15 text-white text-sm"
              >
                {t("common.previous")}
              </button>
            </div>
          </UploaderFormSection>
        )}
      </UploaderFormShell>
    </AppPageShell>
  );
}
