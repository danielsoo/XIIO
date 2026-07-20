"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppPageShell from "@/components/layout/AppPageShell";
import SubpageHeader from "@/components/layout/SubpageHeader";
import UploaderHeaderActions from "@/components/uploader/UploaderHeaderActions";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import type { UploaderAnalyticsPayload } from "@/types/engagement";

function mergeDailyKeys(views: Record<string, number>, likes: Record<string, number>) {
  const keys = new Set([...Object.keys(views), ...Object.keys(likes)]);
  return [...keys]
    .sort()
    .map((date) => ({
      date,
      views: views[date] ?? 0,
      likes: likes[date] ?? 0,
    }));
}

export default function UploaderAnalyticsContent() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslations();
  const [data, setData] = useState<UploaderAnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/me/analytics?days=30", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json().catch(() => ({}))) as UploaderAnalyticsPayload & {
          message?: string;
        };
        if (!res.ok) {
          throw new Error(json.message ?? `HTTP ${res.status}`);
        }
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "load_failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const engagementRate = useMemo(() => {
    if (!data) return 0;
    const { totalViews, totalLikes } = data.summary;
    if (totalViews <= 0) return 0;
    return Math.round((totalLikes / totalViews) * 1000) / 10;
  }, [data]);

  const viewsChart = useMemo(() => {
    if (!data) return [];
    return mergeDailyKeys(data.summary.viewsByDay, {});
  }, [data]);

  const likesChart = useMemo(() => {
    if (!data) return [];
    return mergeDailyKeys({}, data.summary.likesByDay);
  }, [data]);

  if (authLoading) {
    return (
      <AppPageShell>
        <p className="text-xiio-muted py-16 text-center">{t("common.loading")}</p>
      </AppPageShell>
    );
  }

  if (!user) {
    return (
      <AppPageShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-white">{t("myWorks.loginRequired")}</p>
          <Link href="/login" className="text-xiio-accent hover:underline">
            {t("common.login")}
          </Link>
        </div>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell>
      <div className="space-y-10">
        <SubpageHeader
          title={t("uploader.analytics.title")}
          description={t("uploader.analytics.subtitle")}
          backHref="/uploader/works"
          backLabel={t("myWorks.title")}
          backFallbackHref="/uploader/works"
          endContent={<UploaderHeaderActions area="analytics" />}
        />

        {loading ? (
          <p className="text-xiio-muted">{t("common.loading")}</p>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
            {t("uploader.analytics.loadError")} {error}
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-xiio-surface p-5">
                <p className="text-xs text-xiio-muted mb-1">{t("uploader.analytics.totalLikes")}</p>
                <p className="text-2xl font-bold text-white tabular-nums">{data.summary.totalLikes.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-xiio-surface p-5">
                <p className="text-xs text-xiio-muted mb-1">{t("uploader.analytics.totalViews")}</p>
                <p className="text-2xl font-bold text-white tabular-nums">{data.summary.totalViews.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-xiio-surface p-5">
                <p className="text-xs text-xiio-muted mb-1">{t("uploader.analytics.engagementRate")}</p>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {data.summary.totalViews > 0 ? `${engagementRate}%` : "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title={t("uploader.analytics.chartViewsTitle")}
                empty={t("uploader.analytics.chartEmpty")}
                data={viewsChart}
                dataKey="views"
                stroke="#6366f1"
                name={t("uploader.analytics.chartViewsLabel")}
              />
              <ChartCard
                title={t("uploader.analytics.chartLikesTitle")}
                empty={t("uploader.analytics.chartEmpty")}
                data={likesChart}
                dataKey="likes"
                stroke="#f43f5e"
                name={t("uploader.analytics.chartLikesLabel")}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-xiio-surface p-6 overflow-x-auto">
              <h2 className="text-lg font-semibold text-white mb-4">{t("uploader.analytics.breakdownTitle")}</h2>
              {data.breakdown.length === 0 ? (
                <p className="text-xiio-muted text-sm">{t("uploader.analytics.breakdownEmpty")}</p>
              ) : (
                <table className="w-full text-sm text-left min-w-[32rem]">
                  <thead>
                    <tr className="text-xiio-muted border-b border-white/10">
                      <th className="pb-2 pr-4 font-medium">{t("uploader.analytics.colTitle")}</th>
                      <th className="pb-2 pr-4 font-medium text-right">{t("uploader.analytics.colFullViews")}</th>
                      <th className="pb-2 pr-4 font-medium text-right">{t("uploader.analytics.colPromoViews")}</th>
                      <th className="pb-2 font-medium text-right">{t("uploader.analytics.colPromoLikes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.breakdown.map((row) => (
                      <tr key={row.workId} className="border-b border-white/5 text-white">
                        <td className="py-3 pr-4">{row.title}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">{row.fullViews.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">{row.promoViews.toLocaleString()}</td>
                        <td className="py-3 text-right tabular-nums">{row.promoLikes.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AppPageShell>
  );
}

function ChartCard({
  title,
  empty,
  data,
  dataKey,
  stroke,
  name,
}: {
  title: string;
  empty: string;
  data: { date: string; views?: number; likes?: number }[];
  dataKey: "views" | "likes";
  stroke: string;
  name: string;
}) {
  const hasData = data.some((d) => (d[dataKey] ?? 0) > 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-xiio-surface p-6">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      {!hasData ? (
        <p className="text-xiio-muted text-sm">{empty}</p>
      ) : (
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e1b2e", border: "1px solid #ffffff22", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={2} dot={false} name={name} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
