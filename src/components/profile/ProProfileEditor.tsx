"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { PROFILE_ROLE_TAGS, type ProfileRoleTag } from "@/types/portfolio";

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-xiio-muted/60 focus:outline-none focus:ring-2 focus:ring-xiio-accent/40";

function parseCrewInput(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export default function ProProfileEditor() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [handle, setHandle] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [roleTags, setRoleTags] = useState<ProfileRoleTag[]>([]);
  const [crewInput, setCrewInput] = useState("");
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [openToCollaborate, setOpenToCollaborate] = useState(false);
  const [collaborationNote, setCollaborationNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/me/professional-profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      handle?: string | null;
      headline?: string | null;
      bio?: string | null;
      roleTags?: ProfileRoleTag[];
      crewRoles?: string[];
      isDiscoverable?: boolean;
      openToCollaborate?: boolean;
      collaborationNote?: string | null;
    };
    setHandle(data.handle ?? "");
    setHeadline(data.headline ?? "");
    setBio(data.bio ?? "");
    setRoleTags(data.roleTags ?? []);
    setCrewInput((data.crewRoles ?? []).join(", "));
    setIsDiscoverable(data.isDiscoverable !== false);
    setOpenToCollaborate(!!data.openToCollaborate);
    setCollaborationNote(data.collaborationNote ?? "");
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleRole = (tag: ProfileRoleTag) => {
    setRoleTags((prev) => {
      if (prev.includes(tag)) return prev.filter((x) => x !== tag);
      if (prev.length >= 3) return prev;
      return [...prev, tag];
    });
  };

  const save = async () => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/me/professional-profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handle: handle.trim() || undefined,
          headline,
          bio,
          roleTags,
          crewRoles: parseCrewInput(crewInput),
          isDiscoverable,
          openToCollaborate,
          collaborationNote,
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setErr(data.message ?? data.error ?? t("profile.edit.saveError"));
        return;
      }
      setMsg(t("profile.edit.saved"));
      await load();
    } catch {
      setErr(t("profile.edit.saveError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">{t("profile.edit.aboutTitle")}</h2>
        <p className="text-sm text-xiio-muted mb-4">{t("profile.edit.aboutHint")}</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-xiio-muted mb-1">{t("profile.edit.handle")}</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))}
              placeholder="your_name"
              className={inputClass}
            />
            {handle && (
              <p className="text-xs text-xiio-muted mt-1">
                <Link href={`/people/${handle}`} className="text-xiio-accent hover:underline">
                  /people/{handle}
                </Link>
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-xiio-muted mb-1">{t("profile.edit.headline")}</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={t("profile.edit.headlinePlaceholder")}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-xiio-muted mb-1">{t("profile.edit.bio")}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-1">{t("profile.edit.rolesTitle")}</h3>
        <p className="text-xs text-xiio-muted mb-3">{t("profile.edit.rolesHint")}</p>
        <div className="flex flex-wrap gap-2">
          {PROFILE_ROLE_TAGS.map((tag) => {
            const on = roleTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleRole(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  on
                    ? "bg-xiio-accent/25 border-xiio-accent text-white"
                    : "border-white/15 text-xiio-muted hover:border-white/30"
                }`}
              >
                {t(`network.field.${tag}`)}
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          <label className="block text-xs text-xiio-muted mb-1">{t("profile.edit.crewRoles")}</label>
          <input
            type="text"
            value={crewInput}
            onChange={(e) => setCrewInput(e.target.value)}
            placeholder={t("profile.edit.crewRolesPlaceholder")}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-1">{t("profile.edit.boothTitle")}</h3>
        <p className="text-xs text-xiio-muted mb-3">{t("profile.edit.boothHint")}</p>
        <label className="flex items-center gap-2 text-sm text-white mb-3">
          <input
            type="checkbox"
            checked={isDiscoverable}
            onChange={(e) => setIsDiscoverable(e.target.checked)}
          />
          {t("profile.edit.discoverable")}
        </label>
        <label className="flex items-center gap-2 text-sm text-white mb-3">
          <input
            type="checkbox"
            checked={openToCollaborate}
            onChange={(e) => setOpenToCollaborate(e.target.checked)}
          />
          {t("profile.edit.openToCollaborate")}
        </label>
        {openToCollaborate && (
          <input
            type="text"
            value={collaborationNote}
            onChange={(e) => setCollaborationNote(e.target.value)}
            placeholder={t("profile.edit.collaborationNotePlaceholder")}
            className={inputClass}
          />
        )}
      </div>

      {err && <p className="text-red-400 text-sm">{err}</p>}
      {msg && <p className="text-emerald-400 text-sm">{msg}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="px-5 py-2.5 rounded-lg bg-xiio-accent text-white text-sm font-medium disabled:opacity-40"
      >
        {t("profile.edit.save")}
      </button>
    </div>
  );
}
