"use client";

import { useEffect } from "react";
import type { PublicProfileData } from "@/components/profile/PublicProfileCard";
import {
  useProfessionalProfileSave,
  type ProfessionalProfileSaved,
} from "@/hooks/useProfessionalProfileSave";
import { sanitizeHandleInput } from "@/lib/handle";
import {
  profileFieldErrorClass,
  profileInputClass,
  profileInputErrorClass,
} from "@/lib/profileFormStyles";
import { useTranslations } from "@/context/LocaleContext";

type Props = {
  profile: PublicProfileData;
  handleLocked: boolean;
  onSaved?: (saved: ProfessionalProfileSaved) => void;
};

export default function ProfileAboutForm({ profile, handleLocked, onSaved }: Props) {
  const { t } = useTranslations();
  const { fields, applyFields, save, busy, err, msg, fieldErrors, clearMessages } =
    useProfessionalProfileSave({
    handleLocked,
  });

  const viewHandle = profile.handle;
  const canSetHandleOnce = !handleLocked && !viewHandle?.trim();

  useEffect(() => {
    applyFields({
      handle: profile.handle,
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      openToCollaborate: profile.openToCollaborate === true,
      collaborationNote: profile.collaborationNote ?? "",
    });
    clearMessages();
  }, [
    profile.handle,
    profile.headline,
    profile.bio,
    profile.openToCollaborate,
    profile.collaborationNote,
    applyFields,
    clearMessages,
  ]);

  const handleSave = async () => {
    const saved = await save();
    if (!saved) return;
    onSaved?.(saved);
  };

  const resetFields = () => {
    applyFields({
      handle: profile.handle,
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      openToCollaborate: profile.openToCollaborate === true,
      collaborationNote: profile.collaborationNote ?? "",
    });
    clearMessages();
  };

  const btnOutline =
    "px-4 py-2 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/5 disabled:opacity-40";

  return (
    <div className="space-y-4">
      {canSetHandleOnce && (
        <div>
          <label className="block text-xs text-xiio-muted mb-1">{t("profile.edit.handle")}</label>
          <input
            type="text"
            value={fields.handle}
            onChange={(e) => applyFields({ handle: sanitizeHandleInput(e.target.value) })}
            placeholder="your_name"
            className={`${profileInputClass}${fieldErrors.handle ? ` ${profileInputErrorClass}` : ""}`}
          />
          {fieldErrors.handle ? (
            <p className={profileFieldErrorClass}>{fieldErrors.handle}</p>
          ) : (
            <p className="text-xs text-xiio-muted mt-1">{t("profile.edit.handleHint")}</p>
          )}
        </div>
      )}
      {!canSetHandleOnce && viewHandle && (
        <p className="text-sm text-xiio-accent">@{viewHandle}</p>
      )}
      <div>
        <label className="block text-xs text-xiio-muted mb-1">{t("profile.edit.headline")}</label>
        <input
          type="text"
          value={fields.headline}
          onChange={(e) => applyFields({ headline: e.target.value })}
          placeholder={t("profile.edit.headlinePlaceholder")}
          className={profileInputClass}
        />
      </div>
      <div>
        <label className="block text-xs text-xiio-muted mb-1">{t("profile.edit.bio")}</label>
        <textarea
          value={fields.bio}
          onChange={(e) => applyFields({ bio: e.target.value })}
          rows={5}
          placeholder={t("profile.edit.bioPlaceholder")}
          className={profileInputClass}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={fields.openToCollaborate}
          onChange={(e) => applyFields({ openToCollaborate: e.target.checked })}
        />
        {t("profile.edit.openToCollaborate")}
      </label>
      {fields.openToCollaborate && (
        <input
          type="text"
          value={fields.collaborationNote}
          onChange={(e) => applyFields({ collaborationNote: e.target.value })}
          placeholder={t("profile.edit.collaborationNotePlaceholder")}
          className={profileInputClass}
        />
      )}
      {err && <p className="text-red-400 text-sm">{err}</p>}
      {msg && <p className="text-emerald-400 text-sm">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSave()}
          className="px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm font-medium disabled:opacity-40"
        >
          {t("profile.edit.save")}
        </button>
        <button type="button" disabled={busy} onClick={resetFields} className={btnOutline}>
          {t("profile.edit.cancel")}
        </button>
      </div>
    </div>
  );
}
