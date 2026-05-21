"use client";

import { useEffect, useState } from "react";
import AspectRatioPicker from "@/components/uploader/AspectRatioPicker";
import PromoShortFields from "@/components/uploader/PromoShortFields";
import UploaderFormShell from "@/components/uploader/UploaderFormShell";
import { uploaderInputClass } from "@/components/uploader/uploaderFormStyles";
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
  const fileDuration = useVideoFileDuration(file);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState<WorkSection>("movies");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [contentCategory, setContentCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [director, setDirector] = useState(initialDirector?.trim() ?? "");
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
    Boolean(file) && Boolean(promoTitle.trim()) && !clipInvalid && fileDuration != null;

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
            director: director || undefined,
            description: description || undefined,
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
        await uploadFileViaTus(file, tusEndpoint, {
          onProgress: (percent) => setUploadPercent(percent),
        });
      } catch (streamErr) {
        onError(formatClientError(t, streamErr, { titleKey: "uploader.errorStreamFailed" }));
        return;
      }

      onSuccess({ workId, message: t("uploader.uploadSuccess") });
      setFile(null);
      setTitle("");
      setContentCategory("");
      setTags([]);
      setDirector(initialDirector?.trim() ?? "");
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
        left={<VideoUploadDropzone file={file} onFileChange={setFile} disabled={busy} />}
        right={
          <>
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white">{t("uploader.uploadGroupPlacement")}</h2>
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
                <p className="text-xs text-xiio-muted mb-2">{t("uploader.uploadAspectRatioLabel")}</p>
                <AspectRatioPicker value={aspectRatio} onChange={setAspectRatio} disabled={busy} />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-white">{t("uploader.uploadGroupDetails")}</h2>
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
            </section>

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
              showRequiredHeader
              hideClipSliders={fileDuration == null}
            />

            <details className="group rounded-xl border border-white/10 bg-white/[0.03]">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-white flex items-center justify-between gap-2">
                <span>{t("uploader.uploadGroupOptional")}</span>
                <span className="text-xs text-xiio-muted group-open:hidden">
                  {t("uploader.uploadGroupOptionalExpand")}
                </span>
              </summary>
              <div className="px-4 pb-4 pt-0 space-y-4 border-t border-white/10">
                <div>
                  <label className="block text-xs text-xiio-muted mb-1.5" htmlFor="upload-director">
                    {t("uploader.uploadDirectorLabel")}
                  </label>
                  {initialDirector?.trim() ? (
                    <p className="text-xs text-xiio-muted mb-1.5">{t("uploader.directorSavedHint")}</p>
                  ) : null}
                  <input
                    id="upload-director"
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    placeholder={t("uploader.uploadDirectorPlaceholder")}
                    disabled={busy}
                    className={uploaderInputClass}
                    maxLength={120}
                  />
                </div>
                <div>
                  <label className="block text-xs text-xiio-muted mb-1.5" htmlFor="upload-description">
                    {t("uploader.uploadDescriptionLabel")}
                  </label>
                  <textarea
                    id="upload-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder={t("uploader.uploadDescriptionPlaceholder")}
                    disabled={busy}
                    className={`${uploaderInputClass} resize-y min-h-[5rem]`}
                  />
                </div>
              </div>
            </details>

            {uploadPercent != null && (
              <div className="space-y-1.5">
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-xiio-accent transition-all duration-300"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
                <p className="text-xs text-xiio-muted text-center">
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
          </>
        }
      />
    </form>
  );
}
