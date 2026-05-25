"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";

type EligibleWork = {
  workId: string;
  ownerUid: string;
  title: string;
  role: string;
  portfolioSubmissionHidden: boolean;
};

type ShareRow = {
  id: string;
  token: string;
  title: string;
  visibility: string;
  viewCount: number;
};

export default function PortfolioShareSection() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [works, setWorks] = useState<EligibleWork[]>([]);
  const [title, setTitle] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/me/portfolio-shares", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      shares?: ShareRow[];
      eligibleWorks?: EligibleWork[];
    };
    setShares(data.shares ?? []);
    setWorks(data.eligibleWorks ?? []);
    const hidden = new Set(
      (data.eligibleWorks ?? []).filter((w) => w.portfolioSubmissionHidden).map((w) => w.workId)
    );
    setExcluded(hidden);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleHidden = async (workId: string, hidden: boolean) => {
    if (!user) return;
    const token = await user.getIdToken();
    await fetch(`/api/me/works/${workId}/portfolio-visibility`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ portfolioSubmissionHidden: hidden }),
    });
    setExcluded((prev) => {
      const next = new Set(prev);
      if (hidden) next.add(workId);
      else next.delete(workId);
      return next;
    });
  };

  const createShare = async () => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    setCreatedUrl(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/me/portfolio-shares", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim() || t("portfolio.share.defaultTitle"),
          excludedWorkIds: [...excluded],
        }),
      });
      const data = (await res.json()) as { shareUrl?: string; message?: string };
      if (!res.ok) {
        setErr(data.message ?? t("portfolio.share.createError"));
        return;
      }
      setCreatedUrl(data.shareUrl ?? null);
      setTitle("");
      await load();
    } catch {
      setErr(t("portfolio.share.createError"));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (shareId: string) => {
    if (!user) return;
    const token = await user.getIdToken();
    await fetch(`/api/me/portfolio-shares/${shareId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await load();
  };

  const copyUrl = (path: string) => {
    const full =
      typeof window !== "undefined"
        ? `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`
        : path;
    void navigator.clipboard.writeText(full);
  };

  return (
    <div>
      <h2 className="text-base font-semibold text-white mb-1">{t("portfolio.share.title")}</h2>
      <p className="text-sm text-xiio-muted mb-4">{t("portfolio.share.hint")}</p>

      {works.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-xiio-muted mb-2">{t("portfolio.share.worksToggle")}</p>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {works.map((w) => (
              <li key={w.workId} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={excluded.has(w.workId)}
                  onChange={(e) => void toggleHidden(w.workId, e.target.checked)}
                  id={`hide-${w.workId}`}
                />
                <label htmlFor={`hide-${w.workId}`} className="text-white/90 flex-1">
                  {w.title}
                  <span className="text-xiio-muted text-xs ml-1">
                    ({t(`network.credits.role.${w.role === "owner" ? "director" : w.role}`)})
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-xiio-muted mt-1">{t("portfolio.share.hideHint")}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("portfolio.share.titlePlaceholder")}
          className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void createShare()}
          className="px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm disabled:opacity-40"
        >
          {t("portfolio.share.create")}
        </button>
      </div>

      {createdUrl && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-xs text-emerald-300 mb-2">{t("portfolio.share.created")}</p>
          <code className="text-xs text-white break-all">{createdUrl}</code>
          <button
            type="button"
            onClick={() => copyUrl(createdUrl)}
            className="block mt-2 text-xs text-xiio-accent hover:underline"
          >
            {t("portfolio.share.copy")}
          </button>
        </div>
      )}

      {err && <p className="text-red-400 text-sm mb-3">{err}</p>}

      {shares.length > 0 && (
        <ul className="space-y-2">
          {shares.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div>
                <p className="text-sm text-white">{s.title}</p>
                <p className="text-xs text-xiio-muted">
                  /p/{s.token.slice(0, 8)}… · {s.viewCount} {t("portfolio.share.views")}
                  {s.visibility === "revoked" ? ` · ${t("portfolio.share.revoked")}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {s.visibility === "active" && (
                  <>
                    <button
                      type="button"
                      onClick={() => copyUrl(`/p/${s.token}`)}
                      className="text-xs text-xiio-accent hover:underline"
                    >
                      {t("portfolio.share.copy")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void revoke(s.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      {t("portfolio.share.revoke")}
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
