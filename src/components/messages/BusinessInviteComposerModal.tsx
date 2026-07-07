"use client";

import { useCallback, useEffect, useState } from "react";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import {
  uploadBusinessInviteAttachment,
  validateBusinessInviteAttachmentFile,
} from "@/lib/business-invites/attachmentUpload";
import type { BusinessInviteDirection } from "@/types/business-invite";

type PersonHit = {
  uid: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
};

type EligibleWork = {
  workId: string;
  ownerUid: string;
  title: string;
  role: string;
  portfolioSubmissionHidden: boolean;
};

export type PresetRecipient = {
  uid: string;
  handle: string;
  displayName: string;
};

type Props = {
  presetRecipient?: PresetRecipient;
  onClose: () => void;
  onSent?: () => void;
};

export default function BusinessInviteComposerModal({ presetRecipient, onClose, onSent }: Props) {
  const { user } = useAuth();
  const { t } = useTranslations();

  const [recipient, setRecipient] = useState<PresetRecipient | null>(presetRecipient ?? null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonHit[]>([]);
  const [searching, setSearching] = useState(false);

  const [direction, setDirection] = useState<BusinessInviteDirection>("offer");
  const [message, setMessage] = useState("");
  const [works, setWorks] = useState<EligibleWork[]>([]);
  const [selectedWorkIds, setSelectedWorkIds] = useState<Set<string>>(new Set());
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const token = await user.getIdToken();
      const res = await fetch("/api/me/portfolio-shares", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { eligibleWorks?: EligibleWork[] };
      setWorks(data.eligibleWorks ?? []);
    })();
  }, [user]);

  const search = useCallback(
    async (q: string) => {
      if (!user || q.trim().length < 1) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/discover/people?q=${encodeURIComponent(q.trim())}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = (await res.json()) as { people?: PersonHit[] };
        setResults((data.people ?? []).filter((p) => p.uid !== user.uid).slice(0, 12));
      } finally {
        setSearching(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (recipient) return;
    const id = setTimeout(() => void search(query), 300);
    return () => clearTimeout(id);
  }, [query, recipient, search]);

  const toggleWork = (workId: string) => {
    setSelectedWorkIds((prev) => {
      const next = new Set(prev);
      if (next.has(workId)) next.delete(workId);
      else next.add(workId);
      return next;
    });
  };

  const onPickFile = (f: File | null) => {
    setFileErr(null);
    if (!f) {
      setFile(null);
      return;
    }
    const err = validateBusinessInviteAttachmentFile(f);
    if (err === "type") {
      setFileErr(t("dm.invites.attachFileHint"));
      return;
    }
    if (err === "size") {
      setFileErr(t("dm.invites.attachFileHint"));
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!user || !recipient || sending) return;
    setSending(true);
    setErr(null);
    try {
      let attachment: { attachmentUrl: string; attachmentFileName: string; attachmentContentType: string } | null = null;
      if (file) {
        const uploadToken = crypto.randomUUID();
        attachment = await uploadBusinessInviteAttachment(user.uid, uploadToken, file);
      }

      const token = await user.getIdToken();
      const res = await fetch("/api/me/business-invites", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientUid: recipient.uid,
          direction,
          message: message.trim() || undefined,
          attachedWorkIds: [...selectedWorkIds],
          attachmentUrl: attachment?.attachmentUrl,
          attachmentFileName: attachment?.attachmentFileName,
          attachmentContentType: attachment?.attachmentContentType,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setErr(data.message ?? t("dm.invites.errorGeneric"));
        return;
      }
      onSent?.();
      onClose();
    } catch {
      setErr(t("dm.invites.errorGeneric"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal
      aria-labelledby="business-invite-composer-title"
    >
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-xiio-surface border border-white/10 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <h2 id="business-invite-composer-title" className="text-lg font-semibold text-white">
            {t("dm.invites.composerTitle")}
          </h2>
          <button type="button" onClick={onClose} className="text-xiio-muted hover:text-white p-1" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto min-h-0">
          {!recipient && (
            <div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("dm.invites.searchPlaceholder")}
                autoFocus
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-xiio-muted focus:outline-none focus:border-xiio-accent/50"
              />
              <ul className="max-h-48 overflow-y-auto mt-2 border border-white/10 rounded-xl divide-y divide-white/5">
                {searching && (
                  <li className="px-4 py-4 text-sm text-xiio-muted text-center">{t("common.loading")}</li>
                )}
                {!searching && query.trim() && results.length === 0 && (
                  <li className="px-4 py-4 text-sm text-xiio-muted text-center">{t("dm.invites.noResults")}</li>
                )}
                {results.map((p) => (
                  <li key={p.uid}>
                    <button
                      type="button"
                      onClick={() => setRecipient({ uid: p.uid, handle: p.handle, displayName: p.displayName })}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition text-left"
                    >
                      <ProfileAvatar
                        displayName={p.displayName}
                        avatarUrl={p.avatarUrl}
                        className="w-9 h-9 rounded-full bg-xiio-accent/20 flex items-center justify-center text-xs font-bold text-white shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{p.displayName}</p>
                        <p className="text-xs text-xiio-accent">@{p.handle}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recipient && (
            <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
              <ProfileAvatar
                displayName={recipient.displayName}
                className="w-9 h-9 rounded-full bg-xiio-accent/20 flex items-center justify-center text-xs font-bold text-white shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{recipient.displayName}</p>
                <p className="text-xs text-xiio-accent">@{recipient.handle}</p>
              </div>
              {!presetRecipient && (
                <button
                  type="button"
                  onClick={() => setRecipient(null)}
                  className="text-xs text-xiio-muted hover:text-white"
                  aria-label="Close"
                >
                  ×
                </button>
              )}
            </div>
          )}

          <div>
            <p className="text-xs text-xiio-muted mb-2">{t("dm.invites.directionLabel")}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDirection("offer")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  direction === "offer"
                    ? "bg-xiio-accent text-white border-xiio-accent"
                    : "border-white/20 text-white hover:bg-white/5"
                }`}
              >
                {t("dm.invites.directionOffer")}
              </button>
              <button
                type="button"
                onClick={() => setDirection("application")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  direction === "application"
                    ? "bg-xiio-accent text-white border-xiio-accent"
                    : "border-white/20 text-white hover:bg-white/5"
                }`}
              >
                {t("dm.invites.directionApplication")}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="business-invite-message" className="text-xs text-xiio-muted mb-2 block">
              {t("dm.invites.messageLabel")}
            </label>
            <textarea
              id="business-invite-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("dm.invites.messagePlaceholder")}
              rows={3}
              maxLength={500}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-xiio-muted focus:outline-none focus:border-xiio-accent/50 resize-none"
            />
          </div>

          {works.length > 0 && (
            <div>
              <p className="text-xs text-xiio-muted mb-1">{t("dm.invites.attachWorksLabel")}</p>
              <p className="text-[10px] text-xiio-muted mb-2">{t("dm.invites.attachWorksHint")}</p>
              <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                {works.map((w) => (
                  <li key={w.workId} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedWorkIds.has(w.workId)}
                      onChange={() => toggleWork(w.workId)}
                      id={`attach-${w.workId}`}
                    />
                    <label htmlFor={`attach-${w.workId}`} className="text-white/90 flex-1 truncate">
                      {w.title}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs text-xiio-muted mb-1">{t("dm.invites.attachFileLabel")}</p>
            <p className="text-[10px] text-xiio-muted mb-2">{t("dm.invites.attachFileHint")}</p>
            {file ? (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                <span className="text-sm text-white truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => onPickFile(null)}
                  className="text-xs text-red-400 hover:underline shrink-0"
                >
                  {t("dm.invites.attachFileRemove")}
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-white file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:text-sm"
              />
            )}
            {fileErr && <p className="text-red-400 text-xs mt-1">{fileErr}</p>}
          </div>

          {err && <p className="text-red-400 text-sm">{err}</p>}
        </div>

        <div className="px-4 py-3 border-t border-white/10 shrink-0">
          <button
            type="button"
            disabled={!recipient || sending}
            onClick={() => void submit()}
            className="w-full px-4 py-2.5 rounded-lg bg-xiio-accent text-white text-sm font-semibold disabled:opacity-40"
          >
            {sending ? t("dm.invites.sending") : t("dm.invites.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
