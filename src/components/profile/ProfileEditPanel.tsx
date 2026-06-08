"use client";

import { useEffect, useState } from "react";
import ProfileIdentityChangePanel from "@/components/profile/ProfileIdentityChangePanel";
import type { PublicProfileData } from "@/components/profile/PublicProfileCard";
import {
  useProfessionalProfileSave,
  type ProfessionalProfileSaved,
} from "@/hooks/useProfessionalProfileSave";
import { sanitizeHandleInput } from "@/lib/handle";
import {
  profileFieldErrorClass,
  profileInitials,
  profileInputClass,
  profileInputErrorClass,
} from "@/lib/profileFormStyles";
import { useTranslations } from "@/context/LocaleContext";
import type { DirectorNameChangeRequest } from "@/types/user";

type Props = {
  profile: PublicProfileData;
  handleLocked: boolean;
  displayNameChangeRequest?: DirectorNameChangeRequest | null;
  handleChangeRequest?: DirectorNameChangeRequest | null;
  onSaved?: (saved: ProfessionalProfileSaved) => void;
  onDisplayNameChangeSubmitted?: (req: DirectorNameChangeRequest) => void;
  onHandleChangeSubmitted?: (req: DirectorNameChangeRequest) => void;
};

export default function ProfileEditPanel({
  profile,
  handleLocked,
  displayNameChangeRequest = null,
  handleChangeRequest = null,
  onSaved,
  onDisplayNameChangeSubmitted,
  onHandleChangeSubmitted,
}: Props) {
  const { t } = useTranslations();
  const [localDisplayReq, setLocalDisplayReq] = useState(displayNameChangeRequest);
  const [localHandleReq, setLocalHandleReq] = useState(handleChangeRequest);
  const { fields, applyFields, save, busy, err, msg, fieldErrors, clearMessages } =
    useProfessionalProfileSave({
      handleLocked,
    });

  const viewHandle = profile.handle;
  const canSetHandleOnce = !handleLocked && !viewHandle?.trim();

  useEffect(() => {
    setLocalDisplayReq(displayNameChangeRequest);
  }, [displayNameChangeRequest]);

  useEffect(() => {
    setLocalHandleReq(handleChangeRequest);
  }, [handleChangeRequest]);

  useEffect(() => {
    applyFields({
      handle: profile.handle,
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      profileLink: profile.profileLink ?? "",
      openToCollaborate: profile.openToCollaborate === true,
      collaborationNote: profile.collaborationNote ?? "",
    });
    clearMessages();
  }, [
    profile.handle,
    profile.headline,
    profile.bio,
    profile.profileLink,
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
      profileLink: profile.profileLink ?? "",
      openToCollaborate: profile.openToCollaborate === true,
      collaborationNote: profile.collaborationNote ?? "",
    });
    clearMessages();
  };

  const btnOutline =
    "px-4 py-2 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/5 disabled:opacity-40";

  return (
    <section className="bg-xiio-surface rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-6 sm:p-8">
        <p className="text-sm text-xiio-muted mb-6">{t("profile.tabs.editHint")}</p>

        <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 sm:items-start mb-6">
          <div
            className="w-20 h-20 shrink-0 rounded-full bg-xiio-accent/20 ring-2 ring-xiio-accent/40 flex items-center justify-center text-2xl font-bold text-white"
            aria-hidden
          >
            {profileInitials(profile.displayName)}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-xs text-xiio-muted mb-0.5">{t("profile.identity.displayNameCurrent")}</p>
              <p className="text-xl font-bold text-white">{profile.displayName}</p>
              <p className="text-xs text-xiio-muted mt-1">{t("profile.identity.displayNameLockedHint")}</p>
            </div>
            {canSetHandleOnce ? (
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
            ) : (
              viewHandle && <p className="text-sm text-xiio-accent">@{viewHandle}</p>
            )}
          </div>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-6">
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
          <div>
            <label className="block text-xs text-xiio-muted mb-1">{t("profile.edit.profileLink")}</label>
            <input
              type="url"
              value={fields.profileLink}
              onChange={(e) => applyFields({ profileLink: e.target.value })}
              placeholder="https://linktr.ee/yourname"
              className={`${profileInputClass}${fieldErrors.profileLink ? ` ${profileInputErrorClass}` : ""}`}
            />
            {fieldErrors.profileLink ? (
              <p className={profileFieldErrorClass}>{fieldErrors.profileLink}</p>
            ) : (
              <p className="text-xs text-xiio-muted mt-1">{t("profile.edit.profileLinkHint")}</p>
            )}
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
        </div>

        {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
        {msg && <p className="text-emerald-400 text-sm mt-3">{msg}</p>}

        <div className="flex flex-wrap gap-2 mt-4">
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

        <ProfileIdentityChangePanel
          kind="displayName"
          currentValue={profile.displayName}
          pendingRequest={localDisplayReq?.status === "pending" ? localDisplayReq : null}
          onSubmitted={(req) => {
            setLocalDisplayReq(req);
            onDisplayNameChangeSubmitted?.(req);
          }}
        />
        {handleLocked && viewHandle && (
          <ProfileIdentityChangePanel
            kind="handle"
            currentValue={viewHandle}
            pendingRequest={localHandleReq?.status === "pending" ? localHandleReq : null}
            onSubmitted={(req) => {
              setLocalHandleReq(req);
              onHandleChangeSubmitted?.(req);
            }}
          />
        )}
      </div>
    </section>
  );
}
