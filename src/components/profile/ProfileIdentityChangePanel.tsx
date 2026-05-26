"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";
import { profileInputClass } from "@/lib/profileFormStyles";
import type { DirectorNameChangeRequest } from "@/types/user";

type Kind = "displayName" | "handle";

type Props = {
  kind: Kind;
  currentValue: string;
  pendingRequest: DirectorNameChangeRequest | null;
  onSubmitted?: (req: DirectorNameChangeRequest) => void;
};

const COPY: Record<
  Kind,
  {
    titleKey: string;
    hintKey: string;
    currentKey: string;
    requestLabelKey: string;
    pendingKey: string;
    successKey: string;
    failedKey: string;
    submitKey: string;
    submittingKey: string;
    apiPath: string;
    bodyField: "requestedName" | "requestedHandle";
    responseField: "displayNameChangeRequest" | "handleChangeRequest";
    inputPlaceholder?: string;
  }
> = {
  displayName: {
    titleKey: "profile.identity.displayNameSection",
    hintKey: "profile.identity.displayNameLockedHint",
    currentKey: "profile.identity.displayNameCurrent",
    requestLabelKey: "profile.identity.displayNameRequestLabel",
    pendingKey: "profile.identity.displayNamePending",
    successKey: "profile.identity.displayNameSuccess",
    failedKey: "profile.identity.displayNameRequestFailed",
    submitKey: "profile.identity.displayNameSubmit",
    submittingKey: "profile.identity.displayNameSubmitting",
    apiPath: "/api/me/display-name-change-request",
    bodyField: "requestedName",
    responseField: "displayNameChangeRequest",
  },
  handle: {
    titleKey: "profile.identity.handleSection",
    hintKey: "profile.identity.handleLockedHint",
    currentKey: "profile.identity.handleCurrent",
    requestLabelKey: "profile.identity.handleRequestLabel",
    pendingKey: "profile.identity.handlePending",
    successKey: "profile.identity.handleSuccess",
    failedKey: "profile.identity.handleRequestFailed",
    submitKey: "profile.identity.handleSubmit",
    submittingKey: "profile.identity.handleSubmitting",
    apiPath: "/api/me/handle-change-request",
    bodyField: "requestedHandle",
    responseField: "handleChangeRequest",
    inputPlaceholder: "your_name",
  },
};

export default function ProfileIdentityChangePanel({
  kind,
  currentValue,
  pendingRequest,
  onSubmitted,
}: Props) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const copy = COPY[kind];
  const [requested, setRequested] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isPending = pendingRequest?.status === "pending";
  const trimmedCurrent = currentValue.trim();
  if (!trimmedCurrent) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isPending) return;
    const trimmed = requested.trim().replace(/^@/, "");
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      const token = await user.getIdToken();
      const res = await fetch(copy.apiPath, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [copy.bodyField]: trimmed,
          reason: reason.trim() || undefined,
        }),
      });
      const { data: body, raw } = await readResponseJson<
        Record<string, unknown> & { message?: string; error?: string }
      >(res);
      if (!res.ok) {
        setError(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
      setSuccess(true);
      setRequested("");
      setReason("");
      const req = body[copy.responseField] as DirectorNameChangeRequest | undefined;
      if (req?.status === "pending") {
        onSubmitted?.(req);
      }
    } catch (err) {
      setError(formatClientError(t, err, { titleKey: copy.failedKey }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mt-4">
      <h3 className="text-sm font-semibold text-white">{t(copy.titleKey)}</h3>
      <p className="text-xs text-xiio-muted mt-1 mb-3 leading-relaxed">{t(copy.hintKey)}</p>
      <p className="text-xs text-xiio-muted">{t(copy.currentKey)}</p>
      <p className="text-sm text-white font-medium mb-3">
        {kind === "handle" ? `@${trimmedCurrent}` : trimmedCurrent}
      </p>

      {isPending && pendingRequest && (
        <div className="mb-3 rounded-lg border border-xiio-accent/30 bg-xiio-accent/10 px-3 py-2 text-sm text-white">
          {t(copy.pendingKey)}
          <p className="text-xs text-xiio-muted mt-1">
            {kind === "handle" ? `@${pendingRequest.requestedName}` : pendingRequest.requestedName}
            {pendingRequest.reason ? ` — ${pendingRequest.reason}` : ""}
          </p>
        </div>
      )}

      {success && !isPending && (
        <p className="mb-3 text-sm text-green-400">{t(copy.successKey)}</p>
      )}
      {error && <p className="mb-3 text-sm text-red-400 whitespace-pre-wrap break-words">{error}</p>}

      <form onSubmit={(e) => void submit(e)} className="space-y-2">
        <div>
          <label className="block text-xs text-xiio-muted mb-1">{t(copy.requestLabelKey)}</label>
          <input
            type="text"
            value={requested}
            onChange={(e) => setRequested(e.target.value.replace(/^@/, ""))}
            disabled={busy || isPending}
            placeholder={copy.inputPlaceholder}
            className={profileInputClass}
            maxLength={120}
          />
        </div>
        <div>
          <label className="block text-xs text-xiio-muted mb-1">
            {t("profile.identity.reasonLabel")}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={busy || isPending}
            placeholder={t("profile.identity.reasonPlaceholder")}
            className={`${profileInputClass} min-h-[64px] resize-y`}
            maxLength={500}
          />
        </div>
        <button
          type="submit"
          disabled={busy || isPending || !requested.trim()}
          className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-sm font-medium"
        >
          {busy ? t(copy.submittingKey) : t(copy.submitKey)}
        </button>
      </form>
    </section>
  );
}
