"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
type Person = {
  uid: string;
  handle: string;
  displayName: string;
  headline?: string;
  openToCollaborate: boolean;
  collaborationNote?: string;
};

type BoothTab = "all" | "open" | "following";

export default function DiscoverBooth() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [boothTab, setBoothTab] = useState<BoothTab>("all");
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (boothTab === "open") params.set("openOnly", "1");
      if (boothTab === "following") params.set("followingOnly", "1");
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/discover/people?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setErr(t("discover.loadError"));
        setPeople([]);
        return;
      }
      const data = (await res.json()) as { people?: Person[] };
      setPeople(data.people ?? []);
    } catch {
      setErr(t("discover.loadError"));
    } finally {
      setLoading(false);
    }
  }, [user, boothTab, q, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const tabBtn = (id: BoothTab, label: string) => (
    <button
      type="button"
      onClick={() => setBoothTab(id)}
      className={`px-3 py-1.5 rounded-lg text-sm border transition ${
        boothTab === id
          ? "bg-xiio-accent border-xiio-accent text-white"
          : "border-white/15 text-xiio-muted hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <h2 className="text-base font-semibold text-white mb-1">{t("discover.title")}</h2>
      <p className="text-sm text-xiio-muted mb-4">{t("discover.lead")}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {tabBtn("all", t("discover.tabAll"))}
        {tabBtn("open", t("discover.tabOpen"))}
        {tabBtn("following", t("discover.tabFollowing"))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void load()}
          placeholder={t("discover.searchPlaceholder")}
          className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm"
        >
          {t("discover.search")}
        </button>
      </div>

      {loading && <p className="text-xiio-muted text-sm">{t("common.loading")}</p>}
      {err && <p className="text-red-400 text-sm">{err}</p>}
      {!loading && !err && people.length === 0 && (
        <p className="text-xiio-muted text-sm">{t("discover.empty")}</p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {people.map((p) => (
          <li key={p.uid}>
            <Link
              href={`/people/${p.handle}`}
              className="block h-full rounded-xl border border-white/10 bg-white/5 p-4 hover:border-xiio-accent/40 transition"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 shrink-0 rounded-full bg-xiio-accent/20 flex items-center justify-center text-sm font-bold text-white"
                  aria-hidden
                >
                  {(p.displayName || "?").slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{p.displayName}</p>
                  <p className="text-xs text-xiio-accent">@{p.handle}</p>
                  {p.headline && (
                    <p className="text-xs text-xiio-muted mt-1 line-clamp-2">{p.headline}</p>
                  )}
                  {p.openToCollaborate && (
                    <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/40 text-emerald-300">
                      {t("discover.openBadge")}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
