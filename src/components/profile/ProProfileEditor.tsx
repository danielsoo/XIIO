"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "@/context/LocaleContext";
import { useProfessionalProfileSave } from "@/hooks/useProfessionalProfileSave";
import { sanitizeHandleInput } from "@/lib/handle";
import {
  profileFieldErrorClass,
  profileInputClass,
  profileInputErrorClass,
} from "@/lib/profileFormStyles";

export default function ProProfileEditor() {
  const { t } = useTranslations();
  const { fields, applyFields, load, save, busy, msg, err, fieldErrors } = useProfessionalProfileSave({
    includeDiscoverable: true,
  });

  useEffect(() => {
    void load();
  }, [load]);

  const handle = fields.handle;

  return (
    <div className="space-y-6">
      {handle && (
        <p className="text-sm text-xiio-muted">
          {t("profile.edit.publicEditHint")}{" "}
          <Link href={`/people/${handle}`} className="text-xiio-accent hover:underline">
            /people/{handle}
          </Link>
        </p>
      )}

      <div>
        <h2 className="text-base font-semibold text-white mb-1">{t("profile.edit.aboutTitle")}</h2>
        <p className="text-sm text-xiio-muted mb-4">{t("profile.edit.aboutHint")}</p>
        <div className="space-y-3">
          <div className="sm:grid sm:grid-cols-2 sm:gap-3">
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
          <div>
            <label className="block text-xs text-xiio-muted mb-1">{t("profile.edit.bio")}</label>
            <textarea
              value={fields.bio}
              onChange={(e) => applyFields({ bio: e.target.value })}
              rows={8}
              placeholder={t("profile.edit.bioPlaceholder")}
              className={profileInputClass}
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
            checked={fields.isDiscoverable}
            onChange={(e) => applyFields({ isDiscoverable: e.target.checked })}
          />
          {t("profile.edit.discoverable")}
        </label>
        <label className="flex items-center gap-2 text-sm text-white mb-3">
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
