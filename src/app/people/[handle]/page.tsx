"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppPageShell from "@/components/layout/AppPageShell";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";

type WorkCard = {
  workId: string;
  ownerUid: string;
  title: string;
  role: string;
  characterName?: string;
  thumbnailUrl?: string | null;
  watchPath: string;
};

type ProfilePayload = {
  profile: {
    handle: string;
    displayName: string;
    headline?: string;
    bio?: string;
    primaryField?: string;
  };
  directed: WorkCard[];
  credited: WorkCard[];
};

export default function PeopleProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { t } = useTranslations();
  const { user } = useAuth();
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/people/${encodeURIComponent(handle)}`);
        if (!res.ok) {
          setErr(t("network.people.notFound"));
          setData(null);
          return;
        }
        setData((await res.json()) as ProfilePayload);
      } catch {
        setErr(t("network.people.loadError"));
      } finally {
        setLoading(false);
      }
    })();
  }, [handle, t]);

  const renderWorks = (items: WorkCard[], title: string) => {
    if (items.length === 0) return null;
    return (
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <li
              key={`${w.ownerUid}_${w.workId}`}
              className="rounded-xl border border-white/10 bg-xiio-surface overflow-hidden"
            >
              {w.thumbnailUrl && (
                <div
                  className="aspect-video bg-black/40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${w.thumbnailUrl})` }}
                />
              )}
              <div className="p-4">
                <h3 className="font-medium text-white">{w.title}</h3>
                <p className="text-xs text-xiio-muted mt-1">
                  {t(`network.credits.role.${w.role}`)}
                  {w.characterName ? ` · ${w.characterName}` : ""}
                </p>
                {user ? (
                  <Link
                    href={w.watchPath}
                    className="inline-block mt-3 text-sm text-xiio-accent hover:underline"
                  >
                    {t("network.people.watch")}
                  </Link>
                ) : (
                  <p className="text-xs text-xiio-muted mt-3">{t("network.people.loginToWatch")}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <AppPageShell>
      {loading ? (
        <p className="text-xiio-muted">{t("common.loading")}</p>
      ) : err || !data ? (
        <p className="text-red-400">{err ?? t("network.people.notFound")}</p>
      ) : (
        <>
          <header className="mb-8">
            <p className="text-sm text-xiio-accent mb-1">@{data.profile.handle}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{data.profile.displayName}</h1>
            {data.profile.headline && (
              <p className="text-white/80 mt-2">{data.profile.headline}</p>
            )}
            {data.profile.bio && (
              <p className="text-xiio-muted mt-3 text-sm leading-relaxed whitespace-pre-wrap">
                {data.profile.bio}
              </p>
            )}
            {data.profile.primaryField && (
              <p className="text-xs text-xiio-muted mt-2">
                {t(`network.field.${data.profile.primaryField}`)}
              </p>
            )}
          </header>
          {renderWorks(data.directed, t("network.people.directed"))}
          {renderWorks(data.credited, t("network.people.credited"))}
        </>
      )}
    </AppPageShell>
  );
}
