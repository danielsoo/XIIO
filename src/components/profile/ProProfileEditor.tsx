"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-xiio-muted/60 focus:outline-none focus:ring-2 focus:ring-xiio-accent/40";

export default function ProProfileEditor() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [handle, setHandle] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
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
      isDiscoverable?: boolean;
      openToCollaborate?: boolean;
      collaborationNote?: string | null;
    };
    setHandle(data.handle ?? "");
    setHeadline(data.headline ?? "");
    setBio(data.bio ?? "");
    setIsDiscoverable(data.isDiscoverable !== false);
    setOpenToCollaborate(!!data.openToCollaborate);
    setCollaborationNote(data.collaborationNote ?? "");
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

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
          roleTags: [],
          crewRoles: [],
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
              rows={8}
              placeholder={t("profile.edit.bioPlaceholder")}
              className={inputClass}
            />
          </div>
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
