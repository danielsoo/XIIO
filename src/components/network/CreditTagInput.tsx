"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { uploaderInputClass } from "@/components/uploader/uploaderFormStyles";
import type { CollabInviteDoc } from "@/types/collab-invite";
import type { WorkCreditInput, WorkCreditRole } from "@/types/credits";
import { WORK_CREDIT_ROLES } from "@/types/credits";

export type TaggedCredit = WorkCreditInput & {
  handle: string;
  displayName: string;
};

export type PendingEmailInvite = {
  email: string;
  role: WorkCreditRole;
  characterName?: string;
};

type SearchHit = { uid: string; handle: string; displayName: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  value: TaggedCredit[];
  onChange: (next: TaggedCredit[]) => void;
  disabled?: boolean;
  workId?: string;
  /** draft: 업로드 전(추가·삭제). published: 업로드 후(추가만) */
  mode?: "draft" | "published";
  pendingEmailInvites?: PendingEmailInvite[];
  onPendingEmailInvitesChange?: (next: PendingEmailInvite[]) => void;
  /** published 모드에서 @handle 추가 시 서버에 즉시 반영 */
  onAddCredit?: (credit: WorkCreditInput) => Promise<void>;
};

const TAGGABLE_ROLES: WorkCreditRole[] = WORK_CREDIT_ROLES.filter((r) => r !== "director");

export default function CreditTagInput({
  value,
  onChange,
  disabled,
  workId,
  mode: modeProp,
  pendingEmailInvites = [],
  onPendingEmailInvitesChange,
  onAddCredit,
}: Props) {
  const mode = modeProp ?? (workId ? "published" : "draft");
  const allowRemove = mode === "draft" && !disabled;
  const { t, locale } = useTranslations();
  const { user } = useAuth();
  const composingRef = useRef(false);
  const compositionEndAtRef = useRef(0);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [role, setRole] = useState<WorkCreditRole>("actor");
  const [characterName, setCharacterName] = useState("");
  const [searching, setSearching] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [showNoResultsHint, setShowNoResultsHint] = useState(false);
  const [addCreditErr, setAddCreditErr] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkCreditRole>("actor");
  const [inviteCharacterName, setInviteCharacterName] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [inviteErr, setInviteErr] = useState<string | null>(null);
  const [fallbackInviteUrl, setFallbackInviteUrl] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<CollabInviteDoc[]>([]);

  const ENTER_DEBOUNCE_MS = 50;

  const loadSentInvites = useCallback(async () => {
    if (!user || !workId) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/me/works/${encodeURIComponent(workId)}/collab-invites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { invites?: CollabInviteDoc[] };
      setSentInvites((data.invites ?? []).filter((i) => i.status === "pending"));
    } catch {
      /* ignore */
    }
  }, [user, workId]);

  useEffect(() => {
    void loadSentInvites();
  }, [loadSentInvites]);

  const search = useCallback(async () => {
    if (!user || query.trim().length < 2) {
      setHits([]);
      return;
    }
    setSearching(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/users/search-by-handle?q=${encodeURIComponent(query.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setHits([]);
        return;
      }
      const data = (await res.json()) as { items?: SearchHit[] };
      setHits((data.items ?? []).filter((h) => h.uid !== user.uid));
    } finally {
      setSearching(false);
    }
  }, [user, query]);

  useEffect(() => {
    const tmr = setTimeout(() => void search(), 300);
    return () => clearTimeout(tmr);
  }, [search]);

  useEffect(() => {
    if (hits.length > 0 && highlight > hits.length - 1) {
      setHighlight(0);
    }
  }, [hits, highlight]);

  const addHit = async (hit: SearchHit) => {
    if (value.some((v) => v.userId === hit.uid && v.role === role)) return;
    const credit: WorkCreditInput = {
      userId: hit.uid,
      role,
      characterName: role === "actor" && characterName.trim() ? characterName.trim() : undefined,
      sortOrder: value.length + 1,
    };
    if (mode === "published" && onAddCredit) {
      setAddCreditErr(null);
      try {
        await onAddCredit(credit);
      } catch (e) {
        setAddCreditErr(e instanceof Error ? e.message : t("network.credits.addError"));
        return;
      }
    } else {
      onChange([
        ...value,
        {
          ...credit,
          handle: hit.handle,
          displayName: hit.displayName,
        },
      ]);
    }
    setQuery("");
    setHits([]);
    setCharacterName("");
    setHighlight(0);
    setShowNoResultsHint(false);
  };

  const remove = (userId: string, creditRole: WorkCreditRole) => {
    onChange(value.filter((v) => !(v.userId === userId && v.role === creditRole)));
  };

  const tryAdd = () => {
    if (searching || hits.length === 0) {
      setShowNoResultsHint(true);
      return;
    }
    const target = hits[highlight] ?? hits[0];
    if (!target) {
      setShowNoResultsHint(true);
      return;
    }
    void addHit(target);
  };

  const clearDraft = () => {
    setQuery("");
    setCharacterName("");
    setHits([]);
    setHighlight(0);
    setShowNoResultsHint(false);
  };

  const queueEmailInvite = () => {
    const email = inviteEmail.trim();
    if (!EMAIL_REGEX.test(email)) {
      setInviteErr(t("network.credits.invite.invalidEmail"));
      return;
    }
    if (!onPendingEmailInvitesChange) return;
    if (
      pendingEmailInvites.some(
        (p) => p.email.toLowerCase() === email.toLowerCase() && p.role === inviteRole
      )
    ) {
      return;
    }
    onPendingEmailInvitesChange([
      ...pendingEmailInvites,
      {
        email,
        role: inviteRole,
        characterName:
          inviteRole === "actor" && inviteCharacterName.trim()
            ? inviteCharacterName.trim()
            : undefined,
      },
    ]);
    setInviteEmail("");
    setInviteCharacterName("");
    setInviteErr(null);
  };

  const sendEmailInvite = async () => {
    const email = inviteEmail.trim();
    if (!EMAIL_REGEX.test(email)) {
      setInviteErr(t("network.credits.invite.invalidEmail"));
      return;
    }
    if (!user || !workId) {
      queueEmailInvite();
      return;
    }
    setInviteSending(true);
    setInviteErr(null);
    setInviteMsg(null);
    setFallbackInviteUrl(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/me/works/${encodeURIComponent(workId)}/collab-invites`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role: inviteRole,
          characterName:
            inviteRole === "actor" && inviteCharacterName.trim()
              ? inviteCharacterName.trim()
              : undefined,
          locale,
        }),
      });
      const data = (await res.json()) as {
        message?: string;
        emailFallbackUrl?: string;
        invite?: CollabInviteDoc;
      };
      if (!res.ok) {
        setInviteErr(data.message ?? t("network.credits.invite.sendError"));
        return;
      }
      setInviteEmail("");
      setInviteCharacterName("");
      if (data.emailFallbackUrl) {
        setFallbackInviteUrl(data.emailFallbackUrl);
        setInviteMsg(t("network.credits.invite.sentWithLink"));
      } else {
        setInviteMsg(t("network.credits.invite.sent"));
      }
      if (data.invite) {
        setSentInvites((prev) => [data.invite!, ...prev]);
      } else {
        await loadSentInvites();
      }
    } catch {
      setInviteErr(t("network.credits.invite.sendError"));
    } finally {
      setInviteSending(false);
    }
  };

  const removeQueuedInvite = (index: number) => {
    onPendingEmailInvitesChange?.(pendingEmailInvites.filter((_, i) => i !== index));
  };

  const copyFallbackLink = async () => {
    if (!fallbackInviteUrl) return;
    try {
      await navigator.clipboard.writeText(fallbackInviteUrl);
      setInviteMsg(t("network.credits.invite.linkCopied"));
    } catch {
      /* ignore */
    }
  };

  const isImeComposing = (e: React.KeyboardEvent<HTMLInputElement>) =>
    e.nativeEvent.isComposing || composingRef.current || e.keyCode === 229;

  const shouldIgnoreEnterAfterComposition = () =>
    Date.now() - compositionEndAtRef.current < ENTER_DEBOUNCE_MS;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hits.length > 0) {
        setHighlight((h) => (h + 1) % hits.length);
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hits.length > 0) {
        setHighlight((h) => (h - 1 + hits.length) % hits.length);
      }
      return;
    }
    if (e.key !== "Enter") return;
    if (isImeComposing(e) || shouldIgnoreEnterAfterComposition()) return;
    e.preventDefault();
    e.stopPropagation();
    tryAdd();
  };

  const handleCharacterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (isImeComposing(e) || shouldIgnoreEnterAfterComposition()) return;
    e.preventDefault();
    e.stopPropagation();
    tryAdd();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-xs text-xiio-muted">{t("network.credits.hint")}</p>

        {value.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {value.map((c) => (
              <li
                key={`${c.userId}-${c.role}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs text-white"
              >
                <span>
                  @{c.handle} · {t(`network.credits.role.${c.role}`)}
                  {c.characterName ? ` (${c.characterName})` : ""}
                </span>
                {allowRemove && (
                  <button
                    type="button"
                    onClick={() => remove(c.userId, c.role)}
                    className="text-xiio-muted hover:text-white"
                    aria-label={t("network.credits.remove")}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {!disabled && (
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-xiio-muted mb-1">
                {t("network.credits.search")}
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                  setShowNoResultsHint(false);
                }}
                onKeyDown={handleSearchKeyDown}
                onCompositionStart={() => {
                  composingRef.current = true;
                }}
                onCompositionEnd={() => {
                  composingRef.current = false;
                  compositionEndAtRef.current = Date.now();
                }}
                placeholder={t("network.credits.searchPlaceholder")}
                className={uploaderInputClass}
              />
            </div>
            <div className="w-32">
              <label className="block text-xs text-xiio-muted mb-1">
                {t("network.credits.roleLabel")}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as WorkCreditRole)}
                className={uploaderInputClass}
              >
                {TAGGABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`network.credits.role.${r}`)}
                  </option>
                ))}
              </select>
            </div>
            {role === "actor" && (
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs text-xiio-muted mb-1">
                  {t("network.credits.character")}
                </label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  onKeyDown={handleCharacterKeyDown}
                  onCompositionStart={() => {
                    composingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    composingRef.current = false;
                    compositionEndAtRef.current = Date.now();
                  }}
                  className={uploaderInputClass}
                />
              </div>
            )}
            <button
              type="button"
              onClick={tryAdd}
              disabled={searching || hits.length === 0}
              className="h-10 w-10 rounded-xl border border-white/15 text-white hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition"
              aria-label={t("network.credits.add")}
            >
              +
            </button>
            <button
              type="button"
              onClick={clearDraft}
              className="h-10 w-10 rounded-xl border border-white/15 text-white hover:bg-white/5 transition"
              aria-label={t("network.credits.clearDraft")}
            >
              ×
            </button>
          </div>
        )}

        {!disabled && (
          <p className="text-xs text-xiio-muted">{t("network.credits.addHint")}</p>
        )}
        {addCreditErr && <p className="text-xs text-red-400">{addCreditErr}</p>}
        {searching && <p className="text-xs text-xiio-muted">{t("network.credits.searching")}</p>}
        {!searching && showNoResultsHint && (
          <p className="text-xs text-amber-400/90">{t("network.credits.addNoResults")}</p>
        )}
        {hits.length > 0 && (
          <ul className="rounded-lg border border-white/10 bg-black/30 divide-y divide-white/5">
            {hits.map((h, i) => (
              <li key={h.uid}>
                <button
                  type="button"
                  onClick={() => void addHit(h)}
                  onMouseEnter={() => setHighlight(i)}
                  className={`w-full text-left px-3 py-2 text-sm transition ${
                    i === highlight ? "bg-xiio-accent/20 text-white" : "hover:bg-white/5"
                  }`}
                >
                  <span className="text-white">@{h.handle}</span>
                  <span className="text-xiio-muted ml-2">{h.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!disabled && (onPendingEmailInvitesChange || workId) && (
        <div className="space-y-3 pt-3 border-t border-white/10">
          <div>
            <p className="text-xs font-medium text-white mb-1">
              {t("network.credits.invite.sectionTitle")}
            </p>
            <p className="text-xs text-xiio-muted leading-relaxed">
              {t("network.credits.invite.hint")}
            </p>
            {mode === "draft" && (
              <p className="text-xs text-amber-400/80 mt-1">{t("network.credits.invite.queued")}</p>
            )}
            {mode === "published" && (
              <p className="text-xs text-xiio-muted/90 mt-1">{t("network.credits.postUploadHint")}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-xiio-muted mb-1">
                {t("network.credits.invite.emailLabel")}
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteErr(null);
                }}
                placeholder={t("network.credits.invite.emailPlaceholder")}
                className={uploaderInputClass}
              />
            </div>
            <div className="w-32">
              <label className="block text-xs text-xiio-muted mb-1">
                {t("network.credits.roleLabel")}
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as WorkCreditRole)}
                className={uploaderInputClass}
              >
                {TAGGABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`network.credits.role.${r}`)}
                  </option>
                ))}
              </select>
            </div>
            {inviteRole === "actor" && (
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs text-xiio-muted mb-1">
                  {t("network.credits.character")}
                </label>
                <input
                  type="text"
                  value={inviteCharacterName}
                  onChange={(e) => setInviteCharacterName(e.target.value)}
                  className={uploaderInputClass}
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => void sendEmailInvite()}
              disabled={inviteSending || !inviteEmail.trim()}
              className="h-10 px-4 rounded-xl border border-white/15 text-white text-sm hover:bg-white/5 disabled:opacity-40 transition"
            >
              {inviteSending
                ? t("network.credits.invite.sending")
                : t("network.credits.invite.send")}
            </button>
          </div>

          {inviteMsg && <p className="text-xs text-emerald-300">{inviteMsg}</p>}
          {inviteErr && <p className="text-xs text-red-400">{inviteErr}</p>}
          {fallbackInviteUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-[10px] text-xiio-muted break-all">{fallbackInviteUrl}</code>
              <button
                type="button"
                onClick={() => void copyFallbackLink()}
                className="text-xs text-xiio-accent hover:underline"
              >
                {t("network.credits.invite.copyLink")}
              </button>
            </div>
          )}

          {mode === "draft" && pendingEmailInvites.length > 0 && (
            <ul className="space-y-1">
              {pendingEmailInvites.map((inv, i) => (
                <li
                  key={`${inv.email}-${inv.role}-${i}`}
                  className="flex items-center justify-between text-xs text-xiio-muted"
                >
                  <span>
                    {t("network.credits.invite.queuedItem", {
                      email: inv.email,
                      role: t(`network.credits.role.${inv.role}`),
                    })}
                  </span>
                  {allowRemove && (
                    <button
                      type="button"
                      onClick={() => removeQueuedInvite(i)}
                      className="text-xiio-muted hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {sentInvites.length > 0 && (
            <div>
              <p className="text-xs text-xiio-muted mb-1">{t("network.credits.invite.pending")}</p>
              <ul className="space-y-1">
                {sentInvites.map((inv) => (
                  <li key={inv.id} className="text-xs text-white/80">
                    {t("network.credits.invite.pendingItem", {
                      email: inv.invitedEmail,
                      role: t(`network.credits.role.${inv.role}`),
                    })}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
