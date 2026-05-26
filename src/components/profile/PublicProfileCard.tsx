"use client";

import { useEffect, useState } from "react";
import PeopleProfileActions from "@/components/profile/PeopleProfileActions";
import ProfileIdentityChangePanel from "@/components/profile/ProfileIdentityChangePanel";
import {
  useProfessionalProfileSave,
  type ProfessionalProfileSaved,
} from "@/hooks/useProfessionalProfileSave";
import { profileInitials, profileInputClass } from "@/lib/profileFormStyles";
import { useTranslations } from "@/context/LocaleContext";
import type { DirectorNameChangeRequest } from "@/types/user";

export type PublicProfileData = {
  uid?: string;
  handle: string;
  displayName: string;
  headline?: string;
  bio?: string;
  openToCollaborate?: boolean;
  collaborationNote?: string;
  followerCount?: number;
  followingCount?: number;
};

type Props = {
  className?: string;
  profile: PublicProfileData;
  editable?: boolean;
  isSelf?: boolean;
  isFollowing?: boolean;
  handleLocked?: boolean;
  displayNameChangeRequest?: DirectorNameChangeRequest | null;
  handleChangeRequest?: DirectorNameChangeRequest | null;
  submissionBadge?: string;
  shareTitle?: string;
  onProfileSaved?: (saved: ProfessionalProfileSaved) => void;
  onDisplayNameChangeSubmitted?: (req: DirectorNameChangeRequest) => void;
  onHandleChangeSubmitted?: (req: DirectorNameChangeRequest) => void;
};

export default function PublicProfileCard({
  className = "",
  profile,
  editable = false,
  isSelf = false,
  isFollowing = false,
  handleLocked = false,
  displayNameChangeRequest = null,
  handleChangeRequest = null,
  submissionBadge,
  shareTitle,
  onProfileSaved,
  onDisplayNameChangeSubmitted,
  onHandleChangeSubmitted,
}: Props) {
  const { t } = useTranslations();
  const [editing, setEditing] = useState(false);
  const [localDisplayReq, setLocalDisplayReq] = useState(displayNameChangeRequest);
  const [localHandleReq, setLocalHandleReq] = useState(handleChangeRequest);
  const { fields, applyFields, save, busy, err, msg, clearMessages } = useProfessionalProfileSave({
    handleLocked,
  });

  useEffect(() => {
    setLocalDisplayReq(displayNameChangeRequest);
  }, [displayNameChangeRequest]);

  useEffect(() => {
    setLocalHandleReq(handleChangeRequest);
  }, [handleChangeRequest]);

  const viewHandle = profile.handle;
  const viewHeadline = profile.headline;
  const viewBio = profile.bio;
  const viewOpen = profile.openToCollaborate;
  const viewNote = profile.collaborationNote;
  const canSetHandleOnce = editable && isSelf && !handleLocked && !viewHandle?.trim();

  useEffect(() => {
    if (!editing) return;
    applyFields({
      handle: profile.handle,
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      openToCollaborate: profile.openToCollaborate === true,
      collaborationNote: profile.collaborationNote ?? "",
    });
    clearMessages();
  }, [
    editing,
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
    setEditing(false);
    onProfileSaved?.(saved);
  };

  const btnOutline =
    "px-4 py-2 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/5 disabled:opacity-40";

  return (
    <section
      className={`bg-xiio-surface rounded-2xl border border-white/10 overflow-hidden ${className}`.trim()}
    >
      <div className="p-6 sm:p-8">
        {submissionBadge && (
          <p className="text-xs text-xiio-muted mb-3 uppercase tracking-wide">{submissionBadge}</p>
        )}
        {shareTitle && <p className="text-sm text-white/70 mb-4">{shareTitle}</p>}

        <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 sm:items-start">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-full bg-xiio-accent/20 ring-2 ring-xiio-accent/40 flex items-center justify-center text-3xl font-bold text-white mx-auto sm:mx-0"
            aria-hidden
          >
            {profileInitials(profile.displayName)}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            {editing ? (
              <div className="space-y-3 text-left">
                <div>
                  <p className="text-xs text-xiio-muted mb-0.5">{t("profile.identity.displayNameCurrent")}</p>
                  <p className="text-2xl font-bold text-white">{profile.displayName}</p>
                  <p className="text-xs text-xiio-muted mt-1">{t("profile.identity.displayNameLockedHint")}</p>
                </div>
                {canSetHandleOnce && (
                  <div>
                    <label className="block text-xs text-xiio-muted mb-1">{t("profile.edit.handle")}</label>
                    <input
                      type="text"
                      value={fields.handle}
                      onChange={(e) => applyFields({ handle: e.target.value.replace(/^@/, "") })}
                      placeholder="your_name"
                      className={profileInputClass}
                    />
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
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{profile.displayName}</h1>
                {viewHandle && <p className="text-sm text-xiio-accent mt-1">@{viewHandle}</p>}
                {viewHeadline && <p className="text-white/80 mt-2 text-base sm:text-lg">{viewHeadline}</p>}
                {viewOpen && (
                  <p className="mt-2 text-sm text-emerald-300/90">
                    {t("discover.openBadge")}
                    {viewNote ? ` — ${viewNote}` : ""}
                  </p>
                )}
                <p className="text-xs text-xiio-muted mt-2">
                  {t("follow.counts", {
                    followers: profile.followerCount ?? 0,
                    following: profile.followingCount ?? 0,
                  })}
                </p>
              </>
            )}

            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              {editable && isSelf && !editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm font-medium"
                >
                  {t("profile.edit.editProfile")}
                </button>
              )}
              {editable && isSelf && editing && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleSave()}
                    className="px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm font-medium disabled:opacity-40"
                  >
                    {t("profile.edit.save")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setEditing(false);
                      clearMessages();
                    }}
                    className={btnOutline}
                  >
                    {t("profile.edit.cancel")}
                  </button>
                </>
              )}
              {!isSelf && profile.uid && (
                <PeopleProfileActions
                  profileUid={profile.uid}
                  handle={profile.handle}
                  isSelf={false}
                  initialFollowing={isFollowing}
                />
              )}
            </div>
          </div>
        </div>

        {editing ? (
          <div className="mt-6 space-y-3 text-left border-t border-white/10 pt-6">
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
          </div>
        ) : (
          viewBio && (
            <p className="text-xiio-muted mt-6 pt-6 border-t border-white/10 text-sm leading-relaxed whitespace-pre-wrap">
              {viewBio}
            </p>
          )
        )}

        {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
        {msg && !editing && <p className="text-emerald-400 text-sm mt-3">{msg}</p>}

        {isSelf && !editing && (
          <div className="mt-2">
            <ProfileIdentityChangePanel
              kind="displayName"
              currentValue={profile.displayName}
              pendingRequest={
                localDisplayReq?.status === "pending" ? localDisplayReq : null
              }
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
        )}
      </div>
    </section>
  );
}
