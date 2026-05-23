"use client";

import { useEffect, useState } from "react";
import AspectRatioPicker from "@/components/uploader/AspectRatioPicker";
import PromoShortFields from "@/components/uploader/PromoShortFields";
import UploaderFormSection from "@/components/uploader/UploaderFormSection";
import UploaderFormShell from "@/components/uploader/UploaderFormShell";
import { uploaderInputClass } from "@/components/uploader/uploaderFormStyles";
import ThumbnailUploadField from "@/components/uploader/ThumbnailUploadField";
import VideoUploadDropzone from "@/components/uploader/VideoUploadDropzone";
import WorkTagInput from "@/components/uploader/WorkTagInput";
import { useTranslations } from "@/context/LocaleContext";
import { useVideoFileDuration } from "@/hooks/useVideoFileDuration";
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
import { defaultPromoClipEnd, validatePromoClipRange } from "@/lib/works/promo-clip";
import { normalizeTags } from "@/lib/works/label-utils";
import { WORK_SECTIONS, type VideoAspectRatio, type WorkSection } from "@/types/work";
import type { User } from "firebase/auth";

type Props = {
  user: User;
  initialDirector?: string | null;
  onSuccess: (payload: { workId: string; message: string }) => void;
  onError: (message: string) => void;
};

export default function UploaderUploadForm({ user, initialDirector, onSuccess, onError }: Props) {
  const { t } = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFieldError, setThumbnailFieldError] = useState<string | null>(null);
  const fileDuration = useVideoFileDuration(file);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState<WorkSection>("movies");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [contentCategory, setContentCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const directorLocked = Boolean(initialDirector?.trim());
  const lockedDirectorName = initialDirector?.trim() ?? "";
  const [director, setDirector] = useState(lockedDirectorName);
  const [description, setDescription] = useState("");
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(30);
  const [busy, setBusy] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  useEffect(() => {
    setAspectRatio(defaultAspectRatioForSection(section));
  }, [section]);

  useEffect(() => {
    if (initialDirector?.trim()) {
      setDirector(initialDirector.trim());
    }
  }, [initialDirector]);

  useEffect(() => {
    if (fileDuration != null && fileDuration > 0) {
      setClipEnd(defaultPromoClipEnd(fileDuration));
      setClipStart(0);
    }
  }, [fileDuration]);

  useEffect(() => {
    if (title.trim() && !promoTitle.trim()) {
      setPromoTitle(title.trim());
    }
  }, [title, promoTitle]);

  const durationForClip = fileDuration ?? 120;
  const clipInvalid = validatePromoClipRange(clipStart, clipEnd, fileDuration ?? undefined) != null;
  const canSubmit =
    Boolean(file) &&
    Boolean(description.trim()) &&
    Boolean(thumbnailFile) &&
    Boolean(promoTitle.trim()) &&
    !clipInvalid &&
    fileDuration != null;

  const handleThumbnailChange = (next: File | null, preview: string | null) => {
    if (!next) {
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (clipInvalid) {
      onError(t("uploader.errorPromoClipInvalid"));
      return;
    }

    setBusy(true);
    setUploadPercent(null);

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
              clipStartSec: clipStart,
              clipEndSec: clipEnd,
            },
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
          onProgress: (percent) => setUploadPercent(percent),
        });
      } catch (streamErr) {
        onError(formatClientError(t, streamErr, { titleKey: "uploader.errorStreamFailed" }));
        return;
      }

      onSuccess({ workId, message: t("uploader.uploadSuccess") });
      setFile(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setThumbnailFieldError(null);
      setTitle("");
      setContentCategory("");
      setTags([]);
      setDirector(lockedDirectorName);
      setDescription("");
      setPromoTitle("");
      setPromoDescription("");
      setClipStart(0);
      setClipEnd(30);
    } catch (unexpected) {
      onError(formatClientError(t, unexpected, { titleKey: "uploader.errorUploadFailed" }));
    } finally {
      setBusy(false);
      setUploadPercent(null);
    }
  };

  return (
    <form onSubmit={(e) => void handleUpload(e)}>
      <UploaderFormShell
        layout="stacked"
        footer={
          <div className="rounded-2xl border border-white/10 bg-xiio-surface p-6 md:p-8 space-y-4">
            {uploadPercent != null && (
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
            <button
              type="submit"
              disabled={busy || !canSubmit}
              className="w-full py-3.5 rounded-xl bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-40 text-white font-semibold transition"
            >
              {busy
                ? uploadPercent != null
                  ? t("uploader.uploadProgress", { percent: uploadPercent })
                  : t("uploader.uploadSubmitting")
                : t("uploader.uploadSubmit")}
            </button>
          </div>
        }
      >
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
            <p className="text-xs text-xiio-muted mb-1">{t("uploader.uploadAspectRatioLabel")}</p>
            <p className="text-xs text-xiio-muted/80 mb-2">{t("uploader.uploadAspectRatioHint")}</p>
            <AspectRatioPicker value={aspectRatio} onChange={setAspectRatio} disabled={busy} />
          </div>
        </UploaderFormSection>

        <UploaderFormSection
          title={t("uploader.uploadZonePromoTitle")}
          hint={t("uploader.uploadZonePromoHint")}
        >
          <ThumbnailUploadField
            file={thumbnailFile}
            previewUrl={thumbnailPreview}
            onFileChange={handleThumbnailChange}
            disabled={busy}
            error={thumbnailFieldError}
          />
          <PromoShortFields
            duration={durationForClip}
            clipStart={clipStart}
            clipEnd={clipEnd}
            onClipStartChange={setClipStart}
            onClipEndChange={setClipEnd}
            title={promoTitle}
            onTitleChange={setPromoTitle}
            description={promoDescription}
            onDescriptionChange={setPromoDescription}
            disabled={busy || fileDuration == null}
            showRequiredHeader={false}
            hideClipSliders={fileDuration == null}
          />
        </UploaderFormSection>
      </UploaderFormShell>
    </form>
  );
}
