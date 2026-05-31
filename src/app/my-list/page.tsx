"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ContentCard from "@/components/ContentCard";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatClientError } from "@/lib/clientErrors";
import { gradientForTitle, watchHref } from "@/lib/works/catalog-ui";
import type { CatalogFeedItem } from "@/types/work";

export default function MyListPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslations();
  const [items, setItems] = useState<CatalogFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/me/watchlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as { items?: CatalogFeedItem[] };
      if (!res.ok) {
        setErr(t("myList.loadError"));
        setItems([]);
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setErr(formatClientError(t, e, { titleKey: "myList.loadError" }));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [t, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, load, user]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-xiio-bg pt-24 px-6 flex items-center justify-center">
        <p className="text-xiio-muted">{t("common.loading")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-xiio-bg text-xiio-muted">
        <Link href="/login" className="text-xiio-accent hover:underline">
          {t("common.loginRequired")}
        </Link>
      </main>
    );
  }

  return (
    <AppPageShell>
      <SubpageHeader
        title={t("myList.title")}
        description={t("myList.subtitle")}
        backFallbackHref="/"
      />

      {loading ? (
        <p className="text-xiio-muted">{t("common.loading")}</p>
      ) : err ? (
        <p className="text-red-400">{err}</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xiio-muted mb-6">{t("myList.empty")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="text-sm px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/15 transition"
            >
              {t("common.home")}
            </Link>
            <Link
              href="/movies"
              className="text-sm px-4 py-2 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white transition"
            >
              {t("nav.movies")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <ContentCard
              key={item.id}
              href={watchHref(item.ownerUid, item.workId)}
              title={item.title}
              contentCategory={item.approvedCategory}
              tags={item.approvedTags}
              thumbnailUrl={item.thumbnailUrl}
              gradient={gradientForTitle(item.title)}
            />
          ))}
        </div>
      )}
    </AppPageShell>
  );
}
