"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import SectionLabel from "@/components/layout/SectionLabel";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { useCatalogFeed } from "@/hooks/useCatalogFeed";
import { peopleProfileHref } from "@/lib/dm/peopleProfileHref";
import { gradientForTitle, watchHref } from "@/lib/works/catalog-ui";
import type { CatalogFeedItem } from "@/types/work";

type PersonResult = {
  uid: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  headline?: string;
  roleTags: string[];
};

const RECENT_SEARCHES_KEY = "xiio:recentSearches";
const MAX_RECENT_SEARCHES = 8;

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  if (typeof window === "undefined") return;
  const trimmed = term.trim();
  if (!trimmed) return;
  const existing = loadRecentSearches().filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
  const next = [trimmed, ...existing].slice(0, MAX_RECENT_SEARCHES);
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

export default function SearchPage({ initialQuery = "" }: { initialQuery?: string }) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setQuery(initialQuery);
    setDebouncedQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  // Debounce: 300ms after the user stops typing before filtering/searching.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      saveRecentSearch(debouncedQuery);
      setRecentSearches(loadRecentSearches());
    }
  }, [debouncedQuery]);

  const { items: movies } = useCatalogFeed("movies", 30);
  const { items: series } = useCatalogFeed("series", 30);
  const { items: entertainment } = useCatalogFeed("entertainment", 30);

  const allWorks = useMemo<CatalogFeedItem[]>(
    () => [...movies, ...series, ...entertainment],
    [movies, series, entertainment]
  );

  const q = debouncedQuery.trim().toLowerCase();

  const titleResults = useMemo(() => {
    if (!q) return [];
    return allWorks.filter((w) => w.title.toLowerCase().includes(q)).slice(0, 20);
  }, [allWorks, q]);

  useEffect(() => {
    if (!q || !user) {
      setPeople([]);
      return;
    }
    let cancelled = false;
    setPeopleLoading(true);
    void (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/discover/people?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json().catch(() => ({}))) as { people?: PersonResult[] };
        if (!cancelled && res.ok) setPeople(data.people ?? []);
      } finally {
        if (!cancelled) setPeopleLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q, user]);

  return (
    <AppPageShell>
      <SubpageHeader title={t("search.title")} backFallbackHref="/" />

      <div className="relative max-w-xl mb-8">
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          className="w-full h-11 rounded-full bg-white/[0.04] border border-white/[0.1] px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent/50"
        />
      </div>

      {!q ? (
        recentSearches.length > 0 ? (
          <section>
            <div className="mb-3">
              <SectionLabel>{t("search.recentLabel")}</SectionLabel>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setQuery(term);
                    setDebouncedQuery(term);
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[13px] text-white/70 hover:text-white hover:border-white/25 transition"
                >
                  {term}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <p className="text-white/40 text-sm">{t("search.prompt")}</p>
        )
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <div className="mb-3">
              <SectionLabel>{t("search.titlesLabel")}</SectionLabel>
            </div>
            {titleResults.length === 0 ? (
              <p className="text-white/40 text-sm">{t("search.noResults")}</p>
            ) : (
              <div className="flex flex-col">
                {titleResults.map((w) => (
                  <Link
                    key={w.id}
                    href={watchHref(w.ownerUid, w.workId)}
                    className="flex items-center gap-3.5 py-2.5 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] transition"
                  >
                    <div className={`relative w-14 aspect-video rounded-md overflow-hidden shrink-0 ${gradientForTitle(w.title)}`}>
                      {w.thumbnailUrl ? (
                        <Image src={w.thumbnailUrl} alt="" fill sizes="56px" className="object-cover" unoptimized />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium text-white truncate">{w.title}</p>
                      <p className="text-[11.5px] text-white/45 mt-0.5">{w.approvedCategory ?? w.section}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {user ? (
            <section>
              <div className="mb-3">
                <SectionLabel>{t("search.peopleLabel")}</SectionLabel>
              </div>
              {peopleLoading ? (
                <p className="text-white/40 text-sm">{t("common.loading")}</p>
              ) : people.length === 0 ? (
                <p className="text-white/40 text-sm">{t("search.noResults")}</p>
              ) : (
                <div className="flex flex-col">
                  {people.map((p) => {
                    const href = peopleProfileHref(p.handle, p.uid);
                    return (
                      <Link
                        key={p.uid}
                        href={href ?? "#"}
                        className="flex items-center gap-3 py-2.5 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] transition"
                      >
                        <ProfileAvatar
                          displayName={p.displayName}
                          avatarUrl={p.avatarUrl}
                          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-medium text-white truncate">{p.displayName}</p>
                          <p className="text-[11.5px] text-white/45 mt-0.5 truncate">
                            {p.headline || p.roleTags[0] || `@${p.handle}`}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}
        </div>
      )}
    </AppPageShell>
  );
}
