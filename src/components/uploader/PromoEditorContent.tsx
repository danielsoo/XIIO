"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import PromoShortFields from "@/components/uploader/PromoShortFields";
import UploadWizardStepper, {
  type UploadWizardStepMeta,
} from "@/components/uploader/UploadWizardStepper";
import SubmissionSurfacePreviews from "@/components/uploader/SubmissionSurfacePreviews";
import ThumbnailPreviewStages from "@/components/uploader/ThumbnailPreviewStages";
import ThumbnailUploadField from "@/components/uploader/ThumbnailUploadField";
import VideoUploadDropzone from "@/components/uploader/VideoUploadDropzone";
import UploaderFormSection from "@/components/uploader/UploaderFormSection";
import UploaderFormShell from "@/components/uploader/UploaderFormShell";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useVideoFileMetadata } from "@/hooks/useVideoFileMetadata";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";
import { uploadFileViaTus } from "@/lib/streamTusUpload";
import { resolveDisplayTitle } from "@/lib/works/display-title";
import { defaultPromoFrameCrop, normalizePromoFrameCrop } from "@/lib/works/promo-crop";
import { getPromoFileValidationError } from "@/lib/works/promo-file-validation";
import { isLegacyClipPromo } from "@/lib/works/promo-video";
import {
  patchPromoThumbnailUrl,
  uploadPromoThumbnail,
  validatePromoThumbnailFile,
} from "@/lib/works/promoThumbnailUpload";
import type {
  PromoPendingRevision,
  PromoShortDoc,
  RevisionReviewStatus,
  PromoFrameCrop,
  StreamStatus,
  WorkDoc,
} from "@/types/work";

type EditorData = {
  work: WorkDoc & { playbackUrl?: string; durationSec?: number };
  promo: (PromoShortDoc & { id: string; playbackUrl?: string }) | null;
  catalogThumbnailUrl?: string;
  revisionMode?: boolean;
  revisionReviewStatus?: RevisionReviewStatus;
  pendingRevision?: PromoPendingRevision | null;
  pendingRevisionPlayback?: string;
};

function isPromoEncoding(status: StreamStatus | undefined): boolean {
  return status === "uploading" || status === "processing";
}

type PromoEditorStepId = "video" | "thumbnail" | "info";

const PROMO_EDITOR_STEPS: PromoEditorStepId[] = ["video", "thumbnail", "info"];

const PROMO_EDITOR_STEP_META: UploadWizardStepMeta[] = [
  { id: "video", titleKey: "promoEditor.stepVideoTitle", hintKey: "promoEditor.stepVideoHint" },
  {
    id: "thumbnail",
    titleKey: "promoEditor.stepThumbnailTitle",
    hintKey: "promoEditor.stepThumbnailHint",
  },
  { id: "info", titleKey: "promoEditor.stepInfoTitle", hintKey: "promoEditor.stepInfoHint" },
];

function computeInitialPromoStepIndex(hasVideo: boolean, hasThumbnail: boolean): number {
  if (!hasVideo) return 0;
  if (!hasThumbnail) return 1;
  return 2;
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
  const [justSavedVideo, setJustSavedVideo] = useState(false);
  const [promoFile, setPromoFile] = useState<File | null>(null);
  const promoMeta = useVideoFileMetadata(promoFile);
  const [promoCrop, setPromoCrop] = useState<PromoFrameCrop>(defaultPromoFrameCrop());

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFieldError, setThumbnailFieldError] = useState<string | null>(null);
  const [savedThumbnailUrl, setSavedThumbnailUrl] = useState<string | null>(null);
  const [catalogThumbnailUrl, setCatalogThumbnailUrl] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const stepInitWorkRef = useRef<string | null>(null);

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
      setCatalogThumbnailUrl(json.catalogThumbnailUrl ?? null);
      setRevisionMode(Boolean(json.revisionMode));
      setRevisionReviewStatus(json.revisionReviewStatus);
      setPendingRevisionPlayback(json.pendingRevisionPlayback);
      const promo = json.promo;
      const rev = json.pendingRevision;
      const source = json.revisionMode && rev ? rev : promo;
      const draft = json.work.promoDraft;
      setTitle(
        resolveDisplayTitle(
          t("common.untitled"),
          source?.title,
          promo?.title,
          draft?.title,
          json.work?.title
        )
      );
      setDescription(
        source?.description ?? promo?.description ?? draft?.description ?? json.work.description ?? ""
      );
      setPromoCrop(normalizePromoFrameCrop(source?.frameCrop ?? promo?.frameCrop));
      const thumb =
        promo?.thumbnailUrl ?? draft?.thumbnailUrl ?? null;
      setSavedThumbnailUrl(thumb);
      setThumbnailFile(null);
      setThumbnailPreview(thumb);
      setThumbnailFieldError(null);
      const encStatus = json.revisionMode ? rev?.streamStatus : promo?.streamStatus;
      if (encStatus && !isPromoEncoding(encStatus) && encStatus === "ready") {
        setJustSavedVideo(false);
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

  useEffect(() => {
    stepInitWorkRef.current = null;
  }, [workId]);

  useEffect(() => {
    if (loading || !data) return;
    if (stepInitWorkRef.current === workId) return;
    stepInitWorkRef.current = workId;
    const rev = Boolean(data.revisionMode);
    const p = data.promo;
    const pr = data.pendingRevision;
    const hasVideo = rev ? Boolean(pr?.streamUid) : Boolean(p?.streamUid);
    const thumb = p?.thumbnailUrl ?? data.work.promoDraft?.thumbnailUrl ?? null;
    setStepIndex(computeInitialPromoStepIndex(hasVideo, Boolean(thumb)));
  }, [loading, data, workId]);

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
      (!promo?.streamUid && Boolean(work.promoDraft)) ||
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

  const handleThumbnailChange = (next: File | null, preview: string | null) => {
    if (!next) {
      setThumbnailFieldError(null);
      setThumbnailFile(null);
      setThumbnailPreview(preview ?? savedThumbnailUrl);
      return;
    }
    const validation = validatePromoThumbnailFile(next);
    if (validation === "type") {
      setThumbnailFile(null);
      setThumbnailPreview(savedThumbnailUrl);
      setThumbnailFieldError(t("uploader.errorThumbnailInvalidType"));
      return;
    }
    if (validation === "size") {
      setThumbnailFile(null);
      setThumbnailPreview(savedThumbnailUrl);
      setThumbnailFieldError(t("uploader.errorThumbnailTooLarge"));
      return;
    }
    setThumbnailFieldError(null);
    setThumbnailFile(next);
    setThumbnailPreview(preview);
  };

  const saveThumbnail = async () => {
    if (!user || !thumbnailFile) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const token = await user.getIdToken();
      const url = await uploadPromoThumbnail(user.uid, workId, thumbnailFile);
      await patchPromoThumbnailUrl(token, workId, url);
      setSavedThumbnailUrl(url);
      setCatalogThumbnailUrl(url);
      setThumbnailFile(null);
      setThumbnailPreview(url);
      setMsg(t("promoEditor.thumbnailSaved"));
      await load({ silent: true });
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "uploader.errorThumbnailUploadFailed" }));
    } finally {
      setBusy(false);
    }
  };

  const savePromoMeta = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await authFetch(`/api/me/works/${workId}/promo`, {
        method: "PUT",
        body: JSON.stringify({ title, description }),
      });
      const { data: body, raw } = await readResponseJson<{ message?: string; error?: string }>(res);
      if (!res.ok) {
        setErr(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
      setMsg(t("promoEditor.metaSaved"));
      await load({ silent: true });
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "myWorks.errorGeneric" }));
    } finally {
      setBusy(false);
    }
  };

  const uploadPromoVideo = async () => {
    if (!promoFile || !user) return;
    const fileErr = getPromoFileValidationError(true, promoMeta);
    if (fileErr === "loading") {
      setErr(t("uploader.errorPromoVideoLoading"));
      return;
    }
    if (fileErr === "too_small") {
      setErr(t("uploader.errorPromoTooSmall"));
      return;
    }
    if (fileErr === "too_short") {
      setErr(t("uploader.errorPromoTooShort"));
      return;
    }
    if (fileErr === "too_long") {
      setErr(t("uploader.errorPromoTooLong"));
      return;
    }
    if (fileErr) {
      setErr(t("uploader.errorPromoVideoInvalid"));
      return;
    }

    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await authFetch(`/api/me/works/${workId}/promo/upload-url`, {
        method: "POST",
        body: JSON.stringify({
          uploadLength: promoFile.size,
          revision: revisionMode,
          frameCrop: promoCrop,
        }),
      });
      const { data: body, raw } = await readResponseJson<{ tusEndpoint?: string; message?: string; error?: string }>(
        res
      );
      if (!res.ok || !body.tusEndpoint) {
        setErr(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
      await uploadFileViaTus(promoFile, body.tusEndpoint);
      setPromoFile(null);
      setPromoCrop(defaultPromoFrameCrop());
      setJustSavedVideo(true);
      setMsg(t("promoEditor.savedEncoding"));
      await load({ silent: true });
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "uploader.errorPromoStreamFailed" }));
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async () => {
    if (!title.trim()) {
      setErr(t("uploader.errorPromoTitleRequired"));
      return;
    }
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
      setJustSavedVideo(false);
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
      setJustSavedVideo(false);
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
  const awaitingPromoUpload =
    fullReady && !promo?.streamUid && Boolean(work.promoDraft) && !promoEncoding;
  const showEditor =
    fullReady &&
    !locked &&
    !promoEncoding &&
    (revisionMode ||
      awaitingPromoUpload ||
      !promo ||
      promo.platformStatus === "draft" ||
      promo.platformStatus === "rejected");
  const savedPromoStatus = revisionMode
    ? Boolean(
        pendingRevision &&
          (promoEncoding ||
            justSavedVideo ||
            pendingRevision.platformStatus === "draft" ||
            pendingRevision.platformStatus === "rejected")
      )
    : Boolean(
        promo &&
          (promoEncoding ||
            justSavedVideo ||
            promo.platformStatus === "draft" ||
            promo.platformStatus === "rejected")
      );

  const activePromo = revisionMode && pendingRevision ? pendingRevision : promo;
  const untitledLabel = t("common.untitled");
  const workDisplayTitle = resolveDisplayTitle(untitledLabel, work.title);
  const activePromoTitle = resolveDisplayTitle(
    untitledLabel,
    activePromo?.title,
    promo?.title,
    work.title
  );
  const promoDurationSec =
    activePromo && "durationSec" in activePromo && activePromo.durationSec
      ? activePromo.durationSec
      : activePromo && activePromo.clipEndSec && activePromo.clipStartSec != null
        ? activePromo.clipEndSec - activePromo.clipStartSec
        : promo?.durationSec;
  const legacyClip =
    activePromo &&
    isLegacyClipPromo(
      revisionMode && pendingRevision ? pendingRevision.clipStartSec : promo?.clipStartSec
    );

  const promoFileError = getPromoFileValidationError(Boolean(promoFile), promoMeta);
  const promoPlaybackUrl =
    revisionMode && pendingRevisionPlayback
      ? pendingRevisionPlayback
      : !revisionMode && promo?.playbackUrl && promo.streamStatus === "ready"
        ? promo.playbackUrl
        : null;
  const liveThumbnailUrl = thumbnailPreview ?? savedThumbnailUrl ?? catalogThumbnailUrl;
  const promoStreamReady = revisionMode
    ? pendingRevision?.streamStatus === "ready"
    : promo?.streamStatus === "ready";

  const currentStep = PROMO_EDITOR_STEPS[stepIndex] ?? "video";
  const isLastStep = stepIndex === PROMO_EDITOR_STEPS.length - 1;
  const progress = ((stepIndex + 1) / PROMO_EDITOR_STEPS.length) * 100;
  const hasPromoVideo = revisionMode
    ? Boolean(pendingRevision?.streamUid)
    : Boolean(promo?.streamUid);

  const stepLabels: Record<PromoEditorStepId, string> = {
    video: t("promoEditor.stepVideoTitle"),
    thumbnail: t("promoEditor.stepThumbnailTitle"),
    info: t("promoEditor.stepInfoTitle"),
  };
  const stepHints: Record<PromoEditorStepId, string> = {
    video: t("promoEditor.stepVideoHint"),
    thumbnail: t("promoEditor.stepThumbnailHint"),
    info: t("promoEditor.stepInfoHint"),
  };

  const scrollWizardTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validatePromoEditorStep = (step: PromoEditorStepId): boolean => {
    switch (step) {
      case "video": {
        if (!fullReady) {
          setErr(t("promoEditor.waitEncoding"));
          return false;
        }
        if (hasPromoVideo && promoEncoding) {
          setErr(t("promoEditor.errorEncodingBeforeNext"));
          return false;
        }
        if (hasPromoVideo && promoStreamReady) return true;
        if (!promoFile) {
          setErr(t("uploader.errorPromoVideoRequired"));
          return false;
        }
        if (promoFileError === "loading") {
          setErr(t("uploader.errorPromoVideoLoading"));
          return false;
        }
        if (promoFileError === "too_small") {
          setErr(t("uploader.errorPromoTooSmall"));
          return false;
        }
        if (promoFileError === "too_short") {
          setErr(t("uploader.errorPromoTooShort"));
          return false;
        }
        if (promoFileError === "too_long") {
          setErr(t("uploader.errorPromoTooLong"));
          return false;
        }
        if (promoFileError) {
          setErr(t("uploader.errorPromoVideoInvalid"));
          return false;
        }
        setErr(t("promoEditor.errorUploadBeforeNext"));
        return false;
      }
      case "thumbnail": {
        if (savedThumbnailUrl) return true;
        if (thumbnailFile) {
          setErr(t("promoEditor.errorSaveThumbnailBeforeNext"));
          return false;
        }
        setErr(t("uploader.errorThumbnailRequired"));
        return false;
      }
      case "info":
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    setErr(null);
    if (!validatePromoEditorStep(currentStep)) return;
    setStepIndex((i) => Math.min(i + 1, PROMO_EDITOR_STEPS.length - 1));
    scrollWizardTop();
  };

  const handleBack = () => {
    setErr(null);
    setStepIndex((i) => Math.max(i - 1, 0));
    scrollWizardTop();
  };

  const handleStepClick = (index: number) => {
    if (busy || index >= stepIndex) return;
    setErr(null);
    setStepIndex(index);
    scrollWizardTop();
  };

  const livePreviewPanel = showEditor ? (
    <SubmissionSurfacePreviews
      workTitle={workDisplayTitle}
      catalogThumbnailUrl={catalogThumbnailUrl}
      liveThumbnailUrl={liveThumbnailUrl}
      title={title}
      description={description}
      director={work.director ?? ""}
      frameCrop={promoCrop}
      promoPlaybackUrl={promoPlaybackUrl}
      fullPlaybackUrl={work.playbackUrl}
      ownerUid={user.uid}
      workId={workId}
    />
  ) : null;

  const editorSections = (
    <>
      {savedPromoStatus && (revisionMode ? pendingRevision : promo) && (
        <section className="rounded-2xl border border-xiio-accent/30 bg-xiio-accent/10 p-5 md:p-6">
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
                {legacyClip && activePromo ? (
                  <li>
                    {t("promoEditor.clipRange", {
                      start: (activePromo.clipStartSec ?? 0).toFixed(1),
                      end: (activePromo.clipEndSec ?? 0).toFixed(1),
                      sec: (
                        (activePromo.clipEndSec ?? 0) - (activePromo.clipStartSec ?? 0)
                      ).toFixed(1),
                    })}
                  </li>
                ) : promoDurationSec ? (
                  <li>{t("promoEditor.videoDuration", { sec: promoDurationSec.toFixed(1) })}</li>
                ) : null}
                <li>{activePromoTitle}</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {showEditor && currentStep === "video" && (
        <UploaderFormSection
          title={t("promoEditor.stepVideoTitle")}
          hint={t("promoEditor.stepVideoHint")}
        >
          <p className="text-xs text-xiio-muted leading-relaxed">{t("uploader.promoVideoFileHint")}</p>
          <VideoUploadDropzone
            file={promoFile}
            onFileChange={setPromoFile}
            crop={promoCrop}
            onCropChange={(next) => setPromoCrop(normalizePromoFrameCrop(next ?? defaultPromoFrameCrop()))}
            meta={promoMeta}
            showPortraitPreview
            disabled={busy}
          />
          {promoFile && promoFileError === "too_small" && (
            <p className="text-xs text-red-400">{t("uploader.errorPromoTooSmall")}</p>
          )}
          {promoFile && promoFileError === "invalid_dimensions" && (
            <p className="text-xs text-red-400">{t("uploader.errorPromoVideoInvalid")}</p>
          )}
          {promoFile && promoFileError === "invalid_duration" && (
            <p className="text-xs text-red-400">{t("uploader.errorPromoVideoInvalid")}</p>
          )}
          {promoFile && promoMeta && promoFileError === "too_short" && (
            <p className="text-xs text-red-400">{t("uploader.errorPromoTooShort")}</p>
          )}
          {promoFile && promoMeta && promoFileError === "too_long" && (
            <p className="text-xs text-red-400">{t("uploader.errorPromoTooLong")}</p>
          )}
          {promoFile ? (
            <button
              type="button"
              disabled={busy || promoFileError === "loading" || Boolean(promoFileError)}
              onClick={() => void uploadPromoVideo()}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-xiio-accent hover:bg-xiio-accent-hover text-white text-sm font-semibold disabled:opacity-40"
            >
              {busy ? t("common.processing") : t("promoEditor.uploadPromoVideo")}
            </button>
          ) : null}
        </UploaderFormSection>
      )}

      {showEditor && currentStep === "thumbnail" && (
        <UploaderFormSection
          title={t("promoEditor.stepThumbnailTitle")}
          hint={t("promoEditor.stepThumbnailHint")}
        >
          <p className="text-xs text-xiio-muted leading-relaxed">{t("promoEditor.thumbnailLiveHint")}</p>
          <ThumbnailUploadField
            file={thumbnailFile}
            previewUrl={thumbnailPreview}
            onFileChange={handleThumbnailChange}
            disabled={busy}
            error={thumbnailFieldError}
          />
          {thumbnailPreview && (
            <ThumbnailPreviewStages
              src={thumbnailPreview}
              fullTitle={t("uploader.fullThumbnailPreviewTitle")}
              fullHint={t("uploader.fullThumbnailPreviewHint")}
              shortsTitle={t("uploader.shortsThumbnailPreviewTitle")}
              shortsHint={t("uploader.shortsThumbnailPreviewHint")}
            />
          )}
          {thumbnailFile ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveThumbnail()}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/5 disabled:opacity-40"
            >
              {busy ? t("common.processing") : t("promoEditor.saveThumbnail")}
            </button>
          ) : null}
        </UploaderFormSection>
      )}

      {showEditor && currentStep === "info" && (
        <UploaderFormSection
          title={t("promoEditor.stepInfoTitle")}
          hint={t("promoEditor.stepInfoHint")}
        >
          <PromoShortFields
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            disabled={busy}
          />
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void savePromoMeta()}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-xiio-accent hover:bg-xiio-accent-hover text-white text-sm font-semibold disabled:opacity-40"
            >
              {busy ? t("common.processing") : t("promoEditor.saveMeta")}
            </button>
            {promo && (promo.platformStatus === "draft" || promo.platformStatus === "rejected") && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void deletePromo()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 disabled:opacity-40"
              >
                {t("promoEditor.deletePromo")}
              </button>
            )}
          </div>
        </UploaderFormSection>
      )}

      {promoEncoding && (
        <div className="rounded-2xl border border-white/10 bg-xiio-surface p-5 md:p-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled
              className="px-5 py-3 rounded-xl bg-white/10 text-xiio-muted text-sm font-medium cursor-not-allowed"
            >
              {t("promoEditor.encodingButton")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void load({ silent: true })}
              className="px-5 py-3 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/5 disabled:opacity-40"
            >
              {t("promoEditor.refreshStatus")}
            </button>
          </div>
        </div>
      )}
    </>
  );

  const wizardFooter = showEditor ? (
    <div className="rounded-2xl border border-white/10 bg-xiio-surface p-6 md:p-8 space-y-4">
      {isLastStep && (
        <p
          className={`text-sm ${canSubmit ? "text-emerald-300/90" : "text-xiio-muted"}`}
        >
          {canSubmit ? t("promoEditor.submitHint") : t("promoEditor.statusReadyBody")}
        </p>
      )}
      <div className="flex gap-3">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={busy}
            className="flex-1 py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 disabled:opacity-40 transition font-medium"
          >
            {t("common.previous")}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (busy) return;
            if (isLastStep) {
              void submitReview();
              return;
            }
            handleNext();
          }}
          disabled={busy || (isLastStep && !canSubmit)}
          className={`py-3 rounded-xl font-semibold transition disabled:opacity-40 ${
            isLastStep
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-xiio-accent hover:bg-xiio-accent-hover text-white"
          } ${stepIndex === 0 ? "w-full" : "flex-1"}`}
        >
          {busy
            ? t("common.processing")
            : isLastStep
              ? t("promoEditor.submitReview")
              : t("common.next")}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <AppPageShell standalone>
        <SubpageHeader
          variant="standalone"
          title={t("promoEditor.title")}
          backHref="/uploader/works"
          backLabel={t("promoEditor.backToWorks")}
          backFallbackHref="/uploader/works"
        />
        <p className="text-xiio-muted text-sm mb-6 -mt-2">{workDisplayTitle}</p>

        <div className={showEditor ? "lg:grid lg:grid-cols-[minmax(200px,240px)_1fr] lg:gap-8 lg:items-start" : undefined}>
          {showEditor && (
            <div className="hidden lg:block sticky top-28 self-start mb-6 lg:mb-0">
              <UploadWizardStepper
                steps={PROMO_EDITOR_STEP_META}
                currentIndex={stepIndex}
                onStepClick={handleStepClick}
                disabled={busy}
                stepsLabelKey="promoEditor.wizardStepsLabel"
              />
            </div>
          )}

          <div className="min-w-0">
        <UploaderFormShell
          layout="stacked"
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
              {awaitingPromoUpload && (
                <PromoStatusBanner
                  variant="encoding"
                  title={t("promoEditor.awaitingPromoUploadTitle")}
                  body={t("promoEditor.awaitingPromoUploadBody")}
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
          footer={wizardFooter}
        >
          {livePreviewPanel}
          {showEditor && (
            <div className="mb-6 lg:hidden">
              <div className="flex justify-between text-xs text-xiio-muted mb-1">
                <span className="font-medium text-white">{stepLabels[currentStep]}</span>
                <span>
                  {t("uploader.uploadStepProgress", {
                    current: stepIndex + 1,
                    total: PROMO_EDITOR_STEPS.length,
                  })}
                </span>
              </div>
              <p className="text-xs text-xiio-muted mb-2 leading-relaxed">{stepHints[currentStep]}</p>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-xiio-accent transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {editorSections}
        </UploaderFormShell>
          </div>
        </div>
    </AppPageShell>
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
