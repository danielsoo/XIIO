"use client";

import { useEffect, useMemo, useState } from "react";
import AspectRatioPicker from "@/components/uploader/AspectRatioPicker";
import PromoShortFields from "@/components/uploader/PromoShortFields";
import UploaderFormSection from "@/components/uploader/UploaderFormSection";
import UploaderFormShell from "@/components/uploader/UploaderFormShell";
import UploadWizardStepper, {
  type UploadWizardStepMeta,
} from "@/components/uploader/UploadWizardStepper";
import { uploaderInputClass } from "@/components/uploader/uploaderFormStyles";
import ThumbnailUploadField from "@/components/uploader/ThumbnailUploadField";
import VideoUploadDropzone from "@/components/uploader/VideoUploadDropzone";
import WorkTagInput from "@/components/uploader/WorkTagInput";
import CreditTagInput, { type TaggedCredit } from "@/components/network/CreditTagInput";
import { useTranslations } from "@/context/LocaleContext";
import { useVideoFileMetadata } from "@/hooks/useVideoFileMetadata";
import { defaultAspectRatioForSection } from "@/lib/works/aspect-ratio";
import {
  formatApiError,
  formatClientError,
  readResponseJson,
  type ApiErrorBody,
} from "@/lib/clientErrors";
import { uploadFileViaTus } from "@/lib/streamTusUpload";
import {
  patchPromoThumbnailUrl,
  uploadPromoThumbnail,
  validatePromoThumbnailFile,
} from "@/lib/works/promoThumbnailUpload";
import {
  isPromoAspectRatio,
  validatePromoVideoDuration,
} from "@/lib/works/promo-video";
import { normalizeTags } from "@/lib/works/label-utils";
import { WORK_SECTIONS, type VideoAspectRatio, type WorkSection } from "@/types/work";
import type { User } from "firebase/auth";

type UploadStepId = "fullWork" | "catalog" | "promo";

const UPLOAD_STEPS: UploadStepId[] = ["fullWork", "catalog", "promo"];

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
  const [thumbnailFieldError, setThumbnailFieldError] = useState<string | null>(null);
  const [promoFile, setPromoFile] = useState<File | null>(null);
  const promoMeta = useVideoFileMetadata(promoFile);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState<WorkSection>("movies");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [contentCategory, setContentCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [credits, setCredits] = useState<TaggedCredit[]>([]);
  const directorLocked = Boolean(initialDirector?.trim());
  const lockedDirectorName = initialDirector?.trim() ?? "";
  const [director, setDirector] = useState(lockedDirectorName);
  const [description, setDescription] = useState("");
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  const currentStep = UPLOAD_STEPS[stepIndex] ?? "fullWork";
  const isLastStep = stepIndex === UPLOAD_STEPS.length - 1;
  const progress = ((stepIndex + 1) / UPLOAD_STEPS.length) * 100;

  const stepLabels: Record<UploadStepId, string> = useMemo(
    () => ({
      fullWork: t("uploader.uploadZoneFullWorkTitle"),
      catalog: t("uploader.uploadZoneCatalogTitle"),
      promo: t("uploader.uploadZonePromoTitle"),
    }),
    [t]
  );

  const stepHints: Record<UploadStepId, string> = useMemo(
    () => ({
      fullWork: t("uploader.uploadZoneFullWorkHint"),
      catalog: t("uploader.uploadZoneCatalogHint"),
      promo: t("uploader.uploadZonePromoHint"),
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

  const promoFileError = (() => {
    if (!promoFile) return null;
    if (!promoMeta) return "loading";
    if (!isPromoAspectRatio(promoMeta.width, promoMeta.height)) {
      return "aspect";
    }
    const durErr = validatePromoVideoDuration(promoMeta.duration);
    if (durErr) return durErr;
    return null;
  })();

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
        if (promoFileError === "aspect") {
          setFormError(t("uploader.errorPromoNotPortrait"));
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
        if (!thumbnailFile) {
          setFormError(t("uploader.errorThumbnailRequired"));
          return false;
        }
        if (!promoTitle.trim()) {
          setFormError(t("uploader.errorPromoTitleRequired"));
          return false;
        }
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
  };

  const handleUpload = async () => {
    if (!validateStep("fullWork") || !validateStep("promo")) {
      return;
    }
    if (!file) {
      onError(t("uploader.errorNoFile"));
      return;
    }
    if (!file.size || !Number.isFinite(file.size)) {
      onError(t("uploader.errorUploadLengthRequired"));
      return;
    }
    if (!description.trim()) {
      onError(t("uploader.errorDescriptionRequired"));
      return;
    }
    if (!thumbnailFile) {
      onError(t("uploader.errorThumbnailRequired"));
      return;
    }
    if (!promoTitle.trim()) {
      onError(t("uploader.errorPromoTitleRequired"));
      return;
    }
    if (!promoFile) {
      onError(t("uploader.errorPromoVideoRequired"));
      return;
    }

    setBusy(true);
    setUploadPercent(null);
    setFormError("");

    try {
      let token: string;
      try {
        token = await user.getIdToken();
      } catch (authErr) {
        onError(formatClientError(t, authErr, { titleKey: "uploader.errorUploadAuth" }));
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
            credits: credits.map(({ userId, role, characterName, sortOrder }) => ({
              userId,
              role,
              characterName,
              sortOrder,
            })),
          }),
        });
      } catch (fetchErr) {
        onError(formatClientError(t, fetchErr, { titleKey: "uploader.errorUploadFailed" }));
        return;
      }

      const { data: sessionData, raw: sessionRaw } = await readResponseJson<{
        workId?: string;
        tusEndpoint?: string;
        error?: string;
        message?: string;
        detail?: string;
      }>(sessionRes);

      if (!sessionRes.ok) {
        const body: ApiErrorBody = sessionData.error || sessionData.message
          ? sessionData
          : { message: sessionRaw.slice(0, 800) || `HTTP ${sessionRes.status}` };
        onError(formatApiError(t, sessionRes.status, body));
        return;
      }

      const tusEndpoint = sessionData.tusEndpoint;
      const workId = sessionData.workId;
      if (!tusEndpoint || !workId) {
        onError(
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

      try {
        const thumbUrl = await uploadPromoThumbnail(user.uid, workId, thumbnailFile);
        await patchPromoThumbnailUrl(token, workId, thumbUrl);
      } catch (thumbErr) {
        onError(
          formatClientError(t, thumbErr, { titleKey: "uploader.errorThumbnailUploadFailed" })
        );
        return;
      }

      try {
        await uploadFileViaTus(file, tusEndpoint, {
          onProgress: (percent) => setUploadPercent(Math.round(percent * 0.5)),
        });
      } catch (streamErr) {
        onError(formatClientError(t, streamErr, { titleKey: "uploader.errorStreamFailed" }));
        return;
      }

      let promoSessionRes: Response;
      try {
        promoSessionRes = await fetch(`/api/me/works/${workId}/promo/upload-url`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uploadLength: promoFile.size }),
        });
      } catch (fetchErr) {
        onError(formatClientError(t, fetchErr, { titleKey: "uploader.errorPromoUploadFailed" }));
        return;
      }

      const { data: promoSession, raw: promoRaw } = await readResponseJson<{
        tusEndpoint?: string;
        message?: string;
        error?: string;
      }>(promoSessionRes);

      if (!promoSessionRes.ok || !promoSession.tusEndpoint) {
        onError(
          formatApiError(t, promoSessionRes.status, {
            ...promoSession,
            message: promoSession.message ?? promoRaw.slice(0, 500),
          })
        );
        return;
      }

      try {
        await uploadFileViaTus(promoFile, promoSession.tusEndpoint, {
          onProgress: (percent) => setUploadPercent(50 + Math.round(percent * 0.5)),
        });
      } catch (streamErr) {
        onError(formatClientError(t, streamErr, { titleKey: "uploader.errorPromoStreamFailed" }));
        return;
      }

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
      setPromoTitle("");
      setPromoDescription("");
    } catch (unexpected) {
      onError(formatClientError(t, unexpected, { titleKey: "uploader.errorUploadFailed" }));
    } finally {
      setBusy(false);
      setUploadPercent(null);
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
          <div className="rounded-2xl border border-white/10 bg-xiio-surface p-6 md:p-8 space-y-4">
            {busy && uploadPercent != null && (
              <div className="space-y-1.5">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-xiio-accent transition-all duration-300"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
                <p className="text-sm text-xiio-muted text-center">
                  {t("uploader.uploadProgress", { percent: uploadPercent })}
                </p>
              </div>
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
                    void handleUpload();
                    return;
                  }
                  handleNext();
                }}
                disabled={busy}
                className={`py-3 rounded-xl bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-40 text-white font-semibold transition ${
                  stepIndex === 0 ? "w-full" : "flex-1"
                }`}
              >
                {busy
                  ? uploadPercent != null
                    ? t("uploader.uploadProgress", { percent: uploadPercent })
                    : t("uploader.uploadSubmitting")
                  : isLastStep
                    ? t("uploader.uploadSubmit")
                    : t("common.next")}
              </button>
            </div>
          </div>
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
              <CreditTagInput value={credits} onChange={setCredits} disabled={busy} />
            </div>
            <div>
              <p className="text-xs text-xiio-muted mb-1">{t("uploader.uploadAspectRatioLabel")}</p>
              <p className="text-xs text-xiio-muted/80 mb-2">{t("uploader.uploadAspectRatioHint")}</p>
              <AspectRatioPicker value={aspectRatio} onChange={setAspectRatio} disabled={busy} />
            </div>
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
              disabled={busy}
            />
            {promoFile && promoFileError === "aspect" && (
              <p className="text-xs text-red-400">{t("uploader.errorPromoNotPortrait")}</p>
            )}
            {promoFile && promoMeta && promoFileError === "too_short" && (
              <p className="text-xs text-red-400">{t("uploader.errorPromoTooShort")}</p>
            )}
            {promoFile && promoMeta && promoFileError === "too_long" && (
              <p className="text-xs text-red-400">{t("uploader.errorPromoTooLong")}</p>
            )}
            <ThumbnailUploadField
              file={thumbnailFile}
              previewUrl={thumbnailPreview}
              onFileChange={handleThumbnailChange}
              disabled={busy}
              error={thumbnailFieldError}
            />
            <PromoShortFields
              title={promoTitle}
              onTitleChange={setPromoTitle}
              description={promoDescription}
              onDescriptionChange={setPromoDescription}
              disabled={busy}
            />
          </UploaderFormSection>
        )}
          </UploaderFormShell>
        </div>
      </div>
    </form>
  );
}
