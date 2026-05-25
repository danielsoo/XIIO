"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { uploaderInputClass } from "@/components/uploader/uploaderFormStyles";
import type { WorkCreditInput, WorkCreditRole } from "@/types/credits";
import { WORK_CREDIT_ROLES } from "@/types/credits";

export type TaggedCredit = WorkCreditInput & {
  handle: string;
  displayName: string;
};

type SearchHit = { uid: string; handle: string; displayName: string };

type Props = {
  value: TaggedCredit[];
  onChange: (next: TaggedCredit[]) => void;
  disabled?: boolean;
};

const TAGGABLE_ROLES: WorkCreditRole[] = WORK_CREDIT_ROLES.filter((r) => r !== "director");

export default function CreditTagInput({ value, onChange, disabled }: Props) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [role, setRole] = useState<WorkCreditRole>("actor");
  const [characterName, setCharacterName] = useState("");
  const [searching, setSearching] = useState(false);

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

  const addHit = (hit: SearchHit) => {
    if (value.some((v) => v.userId === hit.uid && v.role === role)) return;
    onChange([
      ...value,
      {
        userId: hit.uid,
        role,
        handle: hit.handle,
        displayName: hit.displayName,
        characterName: role === "actor" && characterName.trim() ? characterName.trim() : undefined,
        sortOrder: value.length + 1,
      },
    ]);
    setQuery("");
    setHits([]);
    setCharacterName("");
  };

  const remove = (userId: string, creditRole: WorkCreditRole) => {
    onChange(value.filter((v) => !(v.userId === userId && v.role === creditRole)));
  };

  return (
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
              {!disabled && (
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
            <label className="block text-xs text-xiio-muted mb-1">{t("network.credits.search")}</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("network.credits.searchPlaceholder")}
              className={uploaderInputClass}
            />
          </div>
          <div className="w-32">
            <label className="block text-xs text-xiio-muted mb-1">{t("network.credits.roleLabel")}</label>
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
                className={uploaderInputClass}
              />
            </div>
          )}
        </div>
      )}

      {searching && <p className="text-xs text-xiio-muted">{t("network.credits.searching")}</p>}
      {hits.length > 0 && (
        <ul className="rounded-lg border border-white/10 bg-black/30 divide-y divide-white/5">
          {hits.map((h) => (
            <li key={h.uid}>
              <button
                type="button"
                onClick={() => addHit(h)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
              >
                <span className="text-white">@{h.handle}</span>
                <span className="text-xiio-muted ml-2">{h.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
