"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UploaderSubmitFooter from "@/components/uploader/UploaderSubmitFooter";
import AspectRatioPicker from "@/components/uploader/AspectRatioPicker";
import PromoShortFields from "@/components/uploader/PromoShortFields";
import PromoCropFrameEditor from "@/components/uploader/PromoCropFrameEditor";
import SubmissionSurfacePreviews from "@/components/uploader/SubmissionSurfacePreviews";
import ThumbnailPreviewStages from "@/components/uploader/ThumbnailPreviewStages";
import UploaderCropPreviewGrid from "@/components/uploader/UploaderCropPreviewGrid";
import UploaderFormSection from "@/components/uploader/UploaderFormSection";
import UploaderFormShell from "@/components/uploader/UploaderFormShell";
import UploadWizardStepper, {
  type UploadWizardStepMeta,
} from "@/components/uploader/UploadWizardStepper";
import { uploaderInputClass } from "@/components/uploader/uploaderFormStyles";
import ThumbnailUploadField from "@/components/uploader/ThumbnailUploadField";
import VideoUploadDropzone from "@/components/uploader/VideoUploadDropzone";
import WorkTagInput from "@/components/uploader/WorkTagInput";
import CreditTagInput, {
  type PendingEmailInvite,
  type TaggedCredit,
} from "@/components/network/CreditTagInput";
import { useTranslations } from "@/context/LocaleContext";
import { useImageFileMetadata } from "@/hooks/useImageFileMetadata";
import { useVideoFileMetadata } from "@/hooks/useVideoFileMetadata";
import { defaultAspectRatioForSection } from "@/lib/works/aspect-ratio";
import {
  formatApiError,
  formatClientError,
  readResponseJson,
  type ApiErrorBody,
} from "@/lib/clientErrors";
import { patchWorkStagingMeta } from "@/lib/works/patch-work-staging";
import { useUploadLeaveGuard } from "@/hooks/useUploadLeaveGuard";
import {
  applySubmitProgress,
  uploadPercentForPhase,
  uploadPercentForThumbnail,
  type UploadPhase,
} from "@/lib/works/upload-progress";
import { submitStagedWorkForReview } from "@/lib/works/submit-for-review";
import { uploadStagingVideo } from "@/lib/works/work-video-staging";
import { defaultPromoFrameCrop, normalizePromoFrameCrop } from "@/lib/works/promo-crop";
import { CATALOG_THUMBNAIL_FRAME_ASPECT } from "@/lib/works/promo-crop-interaction";
import {
  patchPromoThumbnailUrl,
  uploadPromoThumbnail,
  validatePromoThumbnailFile,
} from "@/lib/works/promoThumbnailUpload";
import { getPromoFileValidationError } from "@/lib/works/promo-file-validation";
import { normalizeTags } from "@/lib/works/label-utils";
import {
  WORK_SECTIONS,
  type PromoFrameCrop,
  type VideoAspectRatio,
  type WorkSection,
} from "@/types/work";
import type { User } from "firebase/auth";

type UploadStepId = "fullWork" | "catalog" | "promo" | "preview";

const UPLOAD_STEPS: UploadStepId[] = ["fullWork", "catalog", "promo", "preview"];

const UPLOAD_STEP_META: UploadWizardStepMeta[] = [
  {
    id: "fullWork",
    titleKey: "uploader.uploadZoneFullWorkTitle",
    hintKey: "uploader.uploadZoneFullWorkHint",
  },
  {
    id: "catalog",
    titleKey: "uploader.uploadZoneCatalogTitle",
    hintKey: "uploader.uploadZoneCatalogHint",
  },
  {
    id: "promo",
    titleKey: "uploader.uploadZonePromoTitle",
    hintKey: "uploader.uploadZonePromoHint",
  },
  {
    id: "preview",
    titleKey: "uploader.uploadZonePreviewTitle",
    hintKey: "uploader.uploadZonePreviewHint",
  },
];

type Props = {
  user: User;
  initialDirector?: string | null;
  onSuccess: (payload: { workId: string; message: string }) => void;
  onError: (message: string) => void;
};

export default function UploaderUploadForm({ user, initialDirector, onSuccess, onError }: Props) {
  const { t } = useTranslations();
  const [stepIndex, setStepIndex] = useState(0);
  const [formError, setFormError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailCrop, setThumbnailCrop] = useState<PromoFrameCrop>(defaultPromoFrameCrop());
  const thumbnailImageMeta = useImageFileMetadata(thumbnailFile ?? thumbnailPreview);
  const [thumbnailFieldError, setThumbnailFieldError] = useState<string | null>(null);
  const [promoFile, setPromoFile] = useState<File | null>(null);
  const promoMeta = useVideoFileMetadata(promoFile);
  const [promoCrop, setPromoCrop] = useState<PromoFrameCrop>(defaultPromoFrameCrop());
  const [title, setTitle] = useState("");
  const [section, setSection] = useState<WorkSection>("movies");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [contentCategory, setContentCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [credits, setCredits] = useState<TaggedCredit[]>([]);
  const [pendingEmailInvites, setPendingEmailInvites] = useState<PendingEmailInvite[]>([]);
  const directorLocked = Boolean(initialDirector?.trim());
  const lockedDirectorName = initialDirector?.trim() ?? "";
  const [director, setDirector] = useState(lockedDirectorName);
  const [description, setDescription] = useState("");
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [fullPlaybackUrl, setFullPlaybackUrl] = useState<string | null>(null);
  const [promoPlaybackUrl, setPromoPlaybackUrl] = useState<string | null>(null);

  const currentStep = UPLOAD_STEPS[stepIndex] ?? "fullWork";
  const isLastStep = stepIndex === UPLOAD_STEPS.length - 1;
  const progress = ((stepIndex + 1) / UPLOAD_STEPS.length) * 100;

  const reportError = useCallback(
    (message: string) => {
      setUploadError(message);
      onError(message);
    },
    [onError]
  );

  useEffect(() => {
    if (!uploadError) return;
    footerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [uploadError]);

  useUploadLeaveGuard(busy);

  const stepLabels: Record<UploadStepId, string> = useMemo(
    () => ({
      fullWork: t("uploader.uploadZoneFullWorkTitle"),
      catalog: t("uploader.uploadZoneCatalogTitle"),
      promo: t("uploader.uploadZonePromoTitle"),
      preview: t("uploader.uploadZonePreviewTitle"),
    }),
    [t]
  );

  const stepHints: Record<UploadStepId, string> = useMemo(
    () => ({
      fullWork: t("uploader.uploadZoneFullWorkHint"),
      catalog: t("uploader.uploadZoneCatalogHint"),
      promo: t("uploader.uploadZonePromoHint"),
      preview: t("uploader.uploadZonePreviewHint"),
    }),
    [t]
  );

  useEffect(() => {
    setAspectRatio(defaultAspectRatioForSection(section));
  }, [section]);

  useEffect(() => {
    if (initialDirector?.trim()) {
      setDirector(initialDirector.trim());
    }
  }, [initialDirector]);

  useEffect(() => {
    if (title.trim() && !promoTitle.trim()) {
      setPromoTitle(title.trim());
    }
  }, [title, promoTitle]);

  const promoFileError = getPromoFileValidationError(Boolean(promoFile), promoMeta);

  useEffect(() => {
    if (!promoFile) {
      setPromoCrop(defaultPromoFrameCrop());
      return;
    }
    setPromoCrop((prev) => normalizePromoFrameCrop(prev));
  }, [promoFile, promoMeta]);

  useEffect(() => {
    if (!file) {
      setFullPlaybackUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFullPlaybackUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!promoFile) {
      setPromoPlaybackUrl(null);
      return;
    }
    const url = URL.createObjectURL(promoFile);
    setPromoPlaybackUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [promoFile]);

  const scrollWizardTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateStep = (step: UploadStepId): boolean => {
    switch (step) {
      case "fullWork":
        if (!file) {
          setFormError(t("uploader.errorNoFile"));
          return false;
        }
        if (!description.trim()) {
          setFormError(t("uploader.errorDescriptionRequired"));
          return false;
        }
        return true;
      case "catalog":
        if (!thumbnailFile) {
          setFormError(t("uploader.errorThumbnailRequired"));
          return false;
        }
        return true;
      case "promo":
        if (!promoFile) {
          setFormError(t("uploader.errorPromoVideoRequired"));
          return false;
        }
        if (promoFileError === "loading") {
          setFormError(t("uploader.errorPromoVideoLoading"));
          return false;
        }
        if (promoFileError === "too_small") {
          setFormError(t("uploader.errorPromoTooSmall"));
          return false;
        }
        if (promoFileError === "too_short") {
          setFormError(t("uploader.errorPromoTooShort"));
          return false;
        }
        if (promoFileError === "too_long") {
          setFormError(t("uploader.errorPromoTooLong"));
          return false;
        }
        if (promoFileError) {
          setFormError(t("uploader.errorPromoVideoInvalid"));
          return false;
        }
        if (!promoTitle.trim()) {
          setFormError(t("uploader.errorPromoTitleRequired"));
          return false;
        }
        return true;
      case "preview":
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    setFormError("");
    if (!validateStep(currentStep)) return;
    setStepIndex((i) => Math.min(i + 1, UPLOAD_STEPS.length - 1));
    scrollWizardTop();
  };

  const handleBack = () => {
    setFormError("");
    setStepIndex((i) => Math.max(i - 1, 0));
    scrollWizardTop();
  };

  const handleStepClick = (index: number) => {
    if (busy || index >= stepIndex) return;
    setFormError("");
    setStepIndex(index);
    scrollWizardTop();
  };

  const handleThumbnailChange = (next: File | null, preview: string | null) => {
    if (!next) {
      setThumbnailFieldError(null);
      setThumbnailFile(null);
      setThumbnailPreview(preview);
      return;
    }
    const validation = validatePromoThumbnailFile(next);
    if (validation === "type") {
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setThumbnailFieldError(t("uploader.errorThumbnailInvalidType"));
      return;
    }
    if (validation === "size") {
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setThumbnailFieldError(t("uploader.errorThumbnailTooLarge"));
      return;
    }
    setThumbnailFieldError(null);
    setThumbnailFile(next);
    setThumbnailPreview(preview);
    setThumbnailCrop(defaultPromoFrameCrop());
  };

  const handleUpload = async () => {
    if (
      !validateStep("fullWork") ||
      !validateStep("catalog") ||
      !validateStep("promo")
    ) {
      return;
    }
    if (!file) {
      reportError(t("uploader.errorNoFile"));
      return;
    }
    if (!file.size || !Number.isFinite(file.size)) {
      reportError(t("uploader.errorUploadLengthRequired"));
      return;
    }
    if (!description.trim()) {
      reportError(t("uploader.errorDescriptionRequired"));
      return;
    }
    if (!thumbnailFile) {
      reportError(t("uploader.errorThumbnailRequired"));
      return;
    }
    if (!promoTitle.trim()) {
      reportError(t("uploader.errorPromoTitleRequired"));
      return;
    }
    if (!promoFile) {
      reportError(t("uploader.errorPromoVideoRequired"));
      return;
    }

    setBusy(true);
    setUploadError(null);
    setUploadPhase("creating");
    setUploadPercent(0);
    setFormError("");

    try {
      let token: string;
      try {
        token = await user.getIdToken();
      } catch (authErr) {
        reportError(formatClientError(t, authErr, { titleKey: "uploader.errorUploadAuth" }));
        return;
      }

      const tagList = normalizeTags(tags);
      const trimmedDescription = description.trim();
      let sessionRes: Response;
      try {
        sessionRes = await fetch("/api/stream/upload-url", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title || file.name,
            section,
            aspectRatio,
            uploadLength: file.size,
            contentCategory: contentCategory.trim() || undefined,
            tags: tagList.length > 0 ? tagList : undefined,
            director: (directorLocked ? lockedDirectorName : director.trim()) || undefined,
            description: trimmedDescription,
            promoDraft: {
              title: promoTitle.trim(),
              description: promoDescription.trim() || undefined,
            },
            credits: credits.map(({ userId, role, sortOrder }) => ({
              userId,
              role,
              sortOrder,
            })),
          }),
        });
      } catch (fetchErr) {
        reportError(formatClientError(t, fetchErr, { titleKey: "uploader.errorUploadFailed" }));
        return;
      }

      const { data: sessionData, raw: sessionRaw } = await readResponseJson<{
        workId?: string;
        staged?: boolean;
        error?: string;
        message?: string;
        detail?: string;
      }>(sessionRes);

      if (!sessionRes.ok) {
        const body: ApiErrorBody = sessionData.error || sessionData.message
          ? sessionData
          : { message: sessionRaw.slice(0, 800) || `HTTP ${sessionRes.status}` };
        reportError(formatApiError(t, sessionRes.status, body));
        return;
      }

      const workId = sessionData.workId;
      if (!workId) {
        reportError(
          [
            t("uploader.errorNoUploadUrl"),
            sessionData.message
              ? `${t("common.errorDetail")}: ${sessionData.message}`
              : sessionRaw
                ? `${t("common.errorDetail")}: ${sessionRaw.slice(0, 300)}`
                : "",
          ]
            .filter(Boolean)
            .join("\n")
        );
        return;
      }

      setUploadPercent(uploadPercentForPhase("creating"));

      try {
        setUploadPhase("thumbnail");
        setUploadPercent(uploadPercentForPhase("creating"));
        const thumbUrl = await uploadPromoThumbnail(user.uid, workId, thumbnailFile, (ratio) => {
          setUploadPercent(uploadPercentForThumbnail(ratio));
        });
        await patchPromoThumbnailUrl(token, workId, {
          thumbnailUrl: thumbUrl,
          thumbnailCrop,
        });
        setUploadPercent(uploadPercentForPhase("thumbnail"));
      } catch (thumbErr) {
        reportError(
          formatClientError(t, thumbErr, { titleKey: "uploader.errorThumbnailUploadFailed" })
        );
        return;
      }

      try {
        setUploadPhase("full");
        setUploadPercent(uploadPercentForPhase("full", 0));
        const fullStaged = await uploadStagingVideo(user.uid, workId, "full", file, (ratio) => {
          setUploadPercent(uploadPercentForPhase("full", ratio));
        });
        setUploadPhase("promo");
        setUploadPercent(uploadPercentForPhase("promo", 0));
        const promoStaged = await uploadStagingVideo(user.uid, workId, "promo", promoFile, (ratio) => {
          setUploadPercent(uploadPercentForPhase("promo", ratio));
        });
        setUploadPhase("finalizing");
        setUploadPercent(uploadPercentForPhase("finalizing"));
        await patchWorkStagingMeta(token, workId, {
          full: {
            path: fullStaged.path,
            bytes: fullStaged.bytes,
            contentType: fullStaged.contentType,
          },
          promo: {
            path: promoStaged.path,
            bytes: promoStaged.bytes,
            contentType: promoStaged.contentType,
          },
        });
        setUploadPercent(uploadPercentForPhase("finalizing"));
      } catch (stageErr) {
        reportError(formatClientError(t, stageErr, { titleKey: "uploader.errorStagingUploadFailed" }));
        return;
      }

      if (pendingEmailInvites.length > 0) {
        for (const inv of pendingEmailInvites) {
          try {
            await fetch(`/api/me/works/${encodeURIComponent(workId)}/collab-invites`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: inv.email,
                role: inv.role,
              }),
            });
          } catch {
            /* non-blocking */
          }
        }
      }

      try {
        setUploadPhase("streamFull");
        await submitStagedWorkForReview({
          token,
          workId,
          frameCrop: promoCrop,
          fullFile: file,
          promoFile,
          onProgress: (p) => applySubmitProgress(p, setUploadPhase, setUploadPercent),
        });
        setUploadPercent(100);
        setUploadPhase("encoding");
      } catch (submitErr) {
        reportError(formatClientError(t, submitErr, { titleKey: "uploader.errorSubmitReviewFailed" }));
        return;
      }

      setUploadError(null);
      onSuccess({ workId, message: t("uploader.uploadSuccess") });
      setStepIndex(0);
      setFile(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setThumbnailFieldError(null);
      setTitle("");
      setContentCategory("");
      setTags([]);
      setDirector(lockedDirectorName);
      setDescription("");
      setPromoFile(null);
      setPromoCrop(defaultPromoFrameCrop());
      setPromoTitle("");
      setPromoDescription("");
      setCredits([]);
      setPendingEmailInvites([]);
    } catch (unexpected) {
      reportError(formatClientError(t, unexpected, { titleKey: "uploader.errorUploadFailed" }));
    } finally {
      setBusy(false);
      setUploadPhase(null);
      setUploadPercent(0);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    // Block implicit Enter submit inside step inputs.
    e.preventDefault();
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="mb-6 lg:hidden">
        <div className="flex justify-between text-xs text-xiio-muted mb-1">
          <span className="font-medium text-white">{stepLabels[currentStep]}</span>
          <span>
            {t("uploader.uploadStepProgress", {
              current: stepIndex + 1,
              total: UPLOAD_STEPS.length,
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

      {formError && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm whitespace-pre-wrap break-words">
          {formError}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(200px,240px)_1fr] lg:gap-8 lg:items-start">
        <div className="hidden lg:block sticky top-28 self-start">
          <UploadWizardStepper
            steps={UPLOAD_STEP_META}
            currentIndex={stepIndex}
            onStepClick={handleStepClick}
            disabled={busy}
          />
        </div>

        <div className="min-w-0">
          <UploaderFormShell
        layout="stacked"
        footer={
          <UploaderSubmitFooter
            footerRef={footerRef}
            busy={busy}
            uploadPercent={uploadPercent}
            uploadPhase={uploadPhase}
            uploadError={uploadError}
            stepIndex={stepIndex}
            isLastStep={isLastStep}
            onBack={handleBack}
            onPrimary={() => {
              if (busy) return;
              if (isLastStep) {
                void handleUpload();
                return;
              }
              handleNext();
            }}
          />
        }
      >
        {currentStep === "fullWork" && (
          <UploaderFormSection
            title={t("uploader.uploadZoneFullWorkTitle")}
            hint={t("uploader.uploadZoneFullWorkHint")}
          >
            <div className="min-h-[320px] md:min-h-[400px]">
              <VideoUploadDropzone file={file} onFileChange={setFile} disabled={busy} />
            </div>
            <div>
              <label className="block text-xs text-xiio-muted mb-1.5" htmlFor="upload-title">
                {t("uploader.uploadTitleLabel")}
              </label>
              <input
                id="upload-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("uploader.uploadTitlePlaceholder")}
                disabled={busy}
                className={`${uploaderInputClass} text-lg font-semibold py-3`}
              />
            </div>
            {directorLocked ? (
              <div>
                <p className="text-xs text-xiio-muted mb-1.5">{t("uploader.uploadDirectorLabel")}</p>
                <p className="text-base font-semibold text-white">
                  {t("uploader.uploadDirectorDisplayValue", { name: lockedDirectorName })}
                </p>
                <p className="text-xs text-xiio-muted mt-1.5">{t("uploader.uploadDirectorReadOnlyHint")}</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-xiio-muted mb-1.5" htmlFor="upload-director-main">
                  {t("uploader.uploadDirectorLabel")}
                </label>
                <input
                  id="upload-director-main"
                  type="text"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  placeholder={t("uploader.uploadDirectorPlaceholder")}
                  disabled={busy}
                  className={uploaderInputClass}
                  maxLength={120}
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-xiio-muted mb-1.5" htmlFor="upload-description">
                {t("uploader.uploadDescriptionLabel")}{" "}
                <span className="text-xiio-accent" aria-hidden>
                  *
                </span>
              </label>
              <textarea
                id="upload-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                placeholder={t("uploader.uploadDescriptionPlaceholder")}
                disabled={busy}
                className={`${uploaderInputClass} resize-y min-h-[6rem]`}
              />
            </div>
          </UploaderFormSection>
        )}

        {currentStep === "catalog" && (
          <UploaderFormSection
            title={t("uploader.uploadZoneCatalogTitle")}
            hint={t("uploader.uploadZoneCatalogHint")}
          >
            <div>
              <p className="text-xs text-xiio-muted mb-2">{t("uploader.uploadSectionLabel")}</p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-thin">
                {WORK_SECTIONS.map((s) => {
                  const selected = section === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={busy}
                      onClick={() => setSection(s)}
                      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition disabled:opacity-40 ${
                        selected
                          ? "bg-xiio-accent text-white"
                          : "bg-white/5 border border-white/15 text-xiio-muted hover:text-white hover:border-white/30"
                      }`}
                    >
                      {t(`myWorks.section.${s}`)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs text-xiio-muted mb-1.5" htmlFor="upload-category">
                {t("uploader.uploadContentCategoryLabel")}
              </label>
              <input
                id="upload-category"
                type="text"
                value={contentCategory}
                onChange={(e) => setContentCategory(e.target.value)}
                placeholder={t("uploader.uploadContentCategoryPlaceholder")}
                disabled={busy}
                className={uploaderInputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-xiio-muted mb-1.5" htmlFor="upload-tags">
                {t("uploader.uploadTagsLabel")}
              </label>
              <WorkTagInput
                value={tags}
                onChange={setTags}
                disabled={busy}
                user={user}
                inputClassName={uploaderInputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-xiio-muted mb-1.5">
                {t("network.credits.sectionTitle")}
              </label>
              <CreditTagInput
                value={credits}
                onChange={setCredits}
                disabled={busy}
                mode="draft"
                pendingEmailInvites={pendingEmailInvites}
                onPendingEmailInvitesChange={setPendingEmailInvites}
              />
            </div>
            <div>
              <p className="text-xs text-xiio-muted mb-1">{t("uploader.uploadAspectRatioLabel")}</p>
              <AspectRatioPicker value={aspectRatio} onChange={setAspectRatio} disabled={busy} />
            </div>
            <ThumbnailUploadField
              file={thumbnailFile}
              previewUrl={thumbnailPreview}
              onFileChange={handleThumbnailChange}
              disabled={busy}
              error={thumbnailFieldError}
            />
            {thumbnailPreview ? (
              <UploaderCropPreviewGrid
                cropHint={t("uploader.thumbnailCropHint")}
                leftLabel={t("uploader.promoRawPreview")}
                left={
                  <PromoCropFrameEditor
                    previewUrl={thumbnailPreview}
                    crop={thumbnailCrop}
                    onCropChange={(next) => setThumbnailCrop(normalizePromoFrameCrop(next))}
                    meta={thumbnailImageMeta}
                    frameAspect={CATALOG_THUMBNAIL_FRAME_ASPECT}
                    isImage
                    disabled={busy}
                  />
                }
                rightLabel={t("uploader.catalogThumbnailPreviewTitle")}
                right={
                  <ThumbnailPreviewStages
                    embedded
                    src={thumbnailPreview}
                    crop={thumbnailCrop}
                    title={t("uploader.catalogThumbnailPreviewTitle")}
                    hint={t("uploader.catalogThumbnailPreviewHint")}
                  />
                }
              />
            ) : null}
          </UploaderFormSection>
        )}

        {currentStep === "promo" && (
          <UploaderFormSection
            title={t("uploader.uploadZonePromoTitle")}
            hint={t("uploader.uploadZonePromoHint")}
          >
            <p className="text-xs text-xiio-muted leading-relaxed">{t("uploader.promoVideoFileHint")}</p>
            <VideoUploadDropzone
              file={promoFile}
              onFileChange={setPromoFile}
              crop={promoCrop}
              onCropChange={(next) => setPromoCrop(normalizePromoFrameCrop(next))}
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
            <PromoShortFields
              title={promoTitle}
              onTitleChange={setPromoTitle}
              description={promoDescription}
              onDescriptionChange={setPromoDescription}
              disabled={busy}
            />
          </UploaderFormSection>
        )}

        {currentStep === "preview" && (
          <UploaderFormSection
            title={t("uploader.uploadZonePreviewTitle")}
            hint={t("uploader.uploadZonePreviewHint")}
          >
            <SubmissionSurfacePreviews
              workTitle={title.trim() || promoTitle.trim()}
              liveThumbnailUrl={thumbnailPreview}
              thumbnailCrop={thumbnailCrop}
              title={promoTitle}
              description={promoDescription}
              director={(directorLocked ? lockedDirectorName : director).trim()}
              frameCrop={promoCrop}
              promoPlaybackUrl={promoPlaybackUrl}
              fullPlaybackUrl={fullPlaybackUrl}
              ownerUid={user.uid}
            />
          </UploaderFormSection>
        )}
          </UploaderFormShell>
        </div>
      </div>
    </form>
  );
}
