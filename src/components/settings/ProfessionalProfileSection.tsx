"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import {
  getHandleErrorMessage,
  getHandleValidationError,
  mapHandleApiError,
  sanitizeHandleInput,
} from "@/lib/handle";
import {
  profileFieldErrorClass,
  profileInputClass,
  profileInputErrorClass,
} from "@/lib/profileFormStyles";
import { PROFESSIONAL_FIELDS, type ProfessionalField } from "@/types/portfolio";

export default function ProfessionalProfileSection() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [handle, setHandle] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [primaryField, setPrimaryField] = useState<ProfessionalField | "">("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [handleError, setHandleError] = useState<string | null>(null);

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
      primaryField?: ProfessionalField | null;
    };
    setHandle(data.handle ?? "");
    setHeadline(data.headline ?? "");
    setBio(data.bio ?? "");
    setPrimaryField(data.primaryField ?? "");
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    setHandleError(null);

    if (handle.trim()) {
      const validationErr = getHandleValidationError(handle, t);
      if (validationErr) {
        setHandleError(validationErr);
        setBusy(false);
        return;
      }
    }

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
          primaryField: primaryField || undefined,
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        const handleCode = mapHandleApiError(data.error);
        if (handleCode) {
          setHandleError(getHandleErrorMessage(handleCode, t));
        } else {
          setErr(data.message ?? data.error ?? t("network.profile.saveError"));
        }
        return;
      }
      setMsg(t("network.profile.saved"));
      await load();
    } catch {
      setErr(t("network.profile.saveError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="text-base font-semibold text-white mb-1">{t("network.profile.title")}</h2>
      <p className="text-sm text-xiio-muted mb-4">{t("network.profile.hint")}</p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-xiio-muted mb-1">{t("network.profile.handle")}</label>
          <input
            type="text"
            value={handle}
            onChange={(e) => {
              setHandle(sanitizeHandleInput(e.target.value));
              setHandleError(null);
            }}
            placeholder="your_name"
            className={`${profileInputClass}${handleError ? ` ${profileInputErrorClass}` : ""}`}
          />
          {handleError ? (
            <p className={profileFieldErrorClass}>{handleError}</p>
          ) : handle ? (
            <p className="text-xs text-xiio-muted mt-1">
              <Link href={`/people/${handle}`} className="text-xiio-accent hover:underline">
                /people/{handle}
              </Link>
            </p>
          ) : (
            <p className="text-xs text-xiio-muted mt-1">{t("profile.edit.handleHint")}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-xiio-muted mb-1">{t("network.profile.headline")}</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className={profileInputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-xiio-muted mb-1">{t("network.profile.bio")}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className={profileInputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-xiio-muted mb-1">{t("network.profile.field")}</label>
          <select
            value={primaryField}
            onChange={(e) => setPrimaryField(e.target.value as ProfessionalField | "")}
            className={profileInputClass}
          >
            <option value="">{t("network.profile.fieldUnset")}</option>
            {PROFESSIONAL_FIELDS.map((f) => (
              <option key={f} value={f}>
                {t(`network.field.${f}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
      {msg && <p className="text-emerald-400 text-sm mt-3">{msg}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="mt-4 px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm font-medium disabled:opacity-40"
      >
        {t("network.profile.save")}
      </button>
    </div>
  );
}
