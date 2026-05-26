"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";

type Props = { className?: string; initialDiscoverable?: boolean };

export default function ProfileDiscoverSettings({
  className = "",
  initialDiscoverable,
}: Props) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [discoverable, setDiscoverable] = useState(initialDiscoverable ?? true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (initialDiscoverable !== undefined) setDiscoverable(initialDiscoverable);
  }, [initialDiscoverable]);

  const save = useCallback(async () => {
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
        body: JSON.stringify({ isDiscoverable: discoverable }),
      });
      const { data: body, raw } = await readResponseJson<{ message?: string; error?: string }>(res);
      if (!res.ok) {
        setErr(formatApiError(t, res.status, { ...body, message: body.message ?? raw.slice(0, 500) }));
        return;
      }
      setMsg(t("profile.edit.saved"));
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "profile.edit.saveError" }));
    } finally {
      setBusy(false);
    }
  }, [user, discoverable, t]);

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-xiio-surface p-5 ${className}`.trim()}
    >
      <h2 className="text-base font-semibold text-white mb-1">{t("profile.edit.boothTitle")}</h2>
      <p className="text-sm text-xiio-muted mb-4">{t("profile.edit.boothHint")}</p>
      <label className="flex items-center gap-2 text-sm text-white mb-4">
        <input
          type="checkbox"
          checked={discoverable}
          onChange={(e) => setDiscoverable(e.target.checked)}
          disabled={busy}
        />
        {t("profile.edit.discoverable")}
      </label>
      {err && <p className="text-red-400 text-sm mb-2">{err}</p>}
      {msg && <p className="text-emerald-400 text-sm mb-2">{msg}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm font-medium disabled:opacity-40"
      >
        {t("profile.edit.save")}
      </button>
    </section>
  );
}
