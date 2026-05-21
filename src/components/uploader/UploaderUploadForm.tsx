"use client";

import { useEffect, useState } from "react";
import AspectRatioPicker from "@/components/uploader/AspectRatioPicker";
import VideoUploadDropzone from "@/components/uploader/VideoUploadDropzone";
import { useTranslations } from "@/context/LocaleContext";
import { defaultAspectRatioForSection } from "@/lib/works/aspect-ratio";
import {
  formatApiError,
  formatClientError,
  formatStreamUploadError,
  readResponseJson,
  type ApiErrorBody,
} from "@/lib/clientErrors";
import { parseTagsFromInput } from "@/lib/works/label-utils";
import { WORK_SECTIONS, type VideoAspectRatio, type WorkSection } from "@/types/work";
import type { User } from "firebase/auth";

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent";

type Props = {
  user: User;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export default function UploaderUploadForm({ user, onSuccess, onError }: Props) {
  const { t } = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState<WorkSection>("movies");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [contentCategory, setContentCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [director, setDirector] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAspectRatio(defaultAspectRatioForSection(section));
  }, [section]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      onError(t("uploader.errorNoFile"));
      return;
    }

    setBusy(true);

    try {
      let token: string;
      try {
        token = await user.getIdToken();
      } catch (authErr) {
        onError(formatClientError(t, authErr, { titleKey: "uploader.errorUploadAuth" }));
        return;
      }

      const tags = parseTagsFromInput(tagsInput);
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
            contentCategory: contentCategory.trim() || undefined,
            tags: tags.length > 0 ? tags : undefined,
            director: director || undefined,
            description: description || undefined,
          }),
        });
      } catch (fetchErr) {
        onError(formatClientError(t, fetchErr, { titleKey: "uploader.errorUploadFailed" }));
        return;
      }

      const { data: sessionData, raw: sessionRaw } = await readResponseJson<{
        uploadURL?: string;
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

      const resolvedUploadUrl = sessionData.uploadURL;
      if (!resolvedUploadUrl) {
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

      const form = new FormData();
      form.append("file", file);

      let uploadRes: Response;
      try {
        uploadRes = await fetch(resolvedUploadUrl, { method: "POST", body: form });
      } catch (streamErr) {
        onError(formatClientError(t, streamErr, { titleKey: "uploader.errorStreamFailed" }));
        return;
      }

      if (!uploadRes.ok) {
        const streamBody = await uploadRes.text().catch(() => "");
        onError(formatStreamUploadError(t, uploadRes.status, streamBody));
        return;
      }

      onSuccess(t("uploader.uploadSuccess"));
      setFile(null);
      setTitle("");
      setContentCategory("");
      setTagsInput("");
      setDirector("");
      setDescription("");
    } catch (unexpected) {
      onError(formatClientError(t, unexpected, { titleKey: "uploader.errorUploadFailed" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleUpload(e)} className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 lg:items-start">
        <VideoUploadDropzone file={file} onFileChange={setFile} disabled={busy} />

        <div className="space-y-8 min-w-0">
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
                className={`${inputClass} text-lg font-semibold py-3`}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-xiio-muted mb-1.5" htmlFor="upload-tags">
                  {t("uploader.uploadTagsLabel")}
                </label>
                <input
                  id="upload-tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder={t("uploader.uploadTagsPlaceholder")}
                  disabled={busy}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

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
                <input
                  id="upload-director"
                  type="text"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  placeholder={t("uploader.uploadDirectorPlaceholder")}
                  disabled={busy}
                  className={inputClass}
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
                  className={`${inputClass} resize-y min-h-[5rem]`}
                />
              </div>
            </div>
          </details>

          <button
            type="submit"
            disabled={busy || !file}
            className="w-full py-3.5 rounded-xl bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-40 text-white font-semibold transition"
          >
            {busy ? t("uploader.uploadSubmitting") : t("uploader.uploadSubmit")}
          </button>
        </div>
      </div>
    </form>
  );
}
