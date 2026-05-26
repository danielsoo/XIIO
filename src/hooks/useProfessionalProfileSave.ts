"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";

export type ProfessionalProfileFields = {
  handle: string;
  headline: string;
  bio: string;
  isDiscoverable: boolean;
  openToCollaborate: boolean;
  collaborationNote: string;
};

export type ProfessionalProfileSaved = {
  handle: string | null;
  headline: string | null;
  bio: string | null;
  isDiscoverable: boolean;
  openToCollaborate: boolean;
  collaborationNote: string | null;
};

const emptyFields: ProfessionalProfileFields = {
  handle: "",
  headline: "",
  bio: "",
  isDiscoverable: true,
  openToCollaborate: false,
  collaborationNote: "",
};

function parseApiProfile(data: Record<string, unknown>): ProfessionalProfileFields {
  return {
    handle: data.handle ? String(data.handle) : "",
    headline: data.headline ? String(data.headline) : "",
    bio: data.bio ? String(data.bio) : "",
    isDiscoverable: data.isDiscoverable !== false,
    openToCollaborate: data.openToCollaborate === true,
    collaborationNote: data.collaborationNote ? String(data.collaborationNote) : "",
  };
}

type Options = {
  /** PATCH 시 isDiscoverable 포함 (계정 편집기) */
  includeDiscoverable?: boolean;
  /** handle이 이미 설정된 경우 PATCH에 handle 미포함 */
  handleLocked?: boolean;
};

export function useProfessionalProfileSave(options: Options = {}) {
  const { includeDiscoverable = false, handleLocked = false } = options;
  const { user } = useAuth();
  const { t } = useTranslations();
  const [fields, setFields] = useState<ProfessionalProfileFields>(emptyFields);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const applyFields = useCallback((next: Partial<ProfessionalProfileFields>) => {
    setFields((prev) => ({ ...prev, ...next }));
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/me/professional-profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as Record<string, unknown>;
    setFields(parseApiProfile(data));
  }, [user]);

  const save = useCallback(async (): Promise<ProfessionalProfileSaved | null> => {
    if (!user) return null;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const token = await user.getIdToken();
      const body: Record<string, unknown> = {
        headline: fields.headline,
        bio: fields.bio,
        roleTags: [],
        crewRoles: [],
        openToCollaborate: fields.openToCollaborate,
        collaborationNote: fields.collaborationNote,
      };
      if (!handleLocked && fields.handle.trim()) {
        body.handle = fields.handle.trim();
      }
      if (includeDiscoverable) {
        body.isDiscoverable = fields.isDiscoverable;
      }
      const res = await fetch("/api/me/professional-profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ProfessionalProfileSaved & {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setErr(data.message ?? data.error ?? t("profile.edit.saveError"));
        return null;
      }
      const saved: ProfessionalProfileSaved = {
        handle: data.handle ?? null,
        headline: data.headline ?? null,
        bio: data.bio ?? null,
        isDiscoverable: data.isDiscoverable !== false,
        openToCollaborate: data.openToCollaborate === true,
        collaborationNote: data.collaborationNote ?? null,
      };
      setFields(parseApiProfile(saved as unknown as Record<string, unknown>));
      setMsg(t("profile.edit.saved"));
      return saved;
    } catch {
      setErr(t("profile.edit.saveError"));
      return null;
    } finally {
      setBusy(false);
    }
  }, [user, fields, includeDiscoverable, handleLocked, t]);

  const clearMessages = useCallback(() => {
    setMsg(null);
    setErr(null);
  }, []);

  return {
    fields,
    setFields,
    applyFields,
    load,
    save,
    busy,
    msg,
    err,
    clearMessages,
  };
}
