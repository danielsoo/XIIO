"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { OnboardingStatsPayload } from "@/types/admin";
import { formatApiError, formatClientError, readResponseJson } from "@/lib/clientErrors";

const PIE_COLORS = ["#6366f1", "#22d3ee", "#a855f7", "#f59e0b", "#64748b"];

export default function OnboardingStatsContent() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [data, setData] = useState<OnboardingStatsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/stats/onboarding", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data: json, raw } = await readResponseJson<OnboardingStatsPayload & { message?: string; error?: string }>(
          res
        );
        if (!res.ok) {
          if (!cancelled) {
            setError(formatApiError(t, res.status, { ...json, message: json.message ?? raw.slice(0, 500) }));
          }
          return;
        }
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(formatClientError(t, e, { titleKey: "admin.onboardingError" }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: t("admin.purposeWatch"), value: data.watch, key: "watch" },
      { name: t("admin.purposeCollaborate"), value: data.collaborate, key: "collaborate" },
      { name: t("admin.purposeUploadSurvey"), value: data.upload, key: "upload" },
      { name: t("admin.purposeBoth"), value: data.both, key: "both" },
      { name: t("admin.purposeOther"), value: data.other, key: "other" },
    ].filter((d) => d.value > 0);
  }, [data, t]);

  if (loading) {
    return <p className="text-xiio-muted">{t("admin.onboardingLoading")}</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm whitespace-pre-wrap break-words">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const dailyEntries = Object.entries(data.signupsByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const dailyChart = dailyEntries.slice(-30);

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-xiio-muted hover:text-xiio-accent transition mb-4 inline-block">
          {t("admin.placeholderBack")}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{t("admin.onboardingTitle")}</h1>
        <p className="text-xiio-muted text-sm mt-2">{t("admin.onboardingIntro")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-xiio-surface p-6">
          <h2 className="text-lg font-semibold text-white mb-4">{t("admin.chartSignupsTitle")}</h2>
          {dailyChart.length === 0 ? (
            <p className="text-xiio-muted text-sm">{t("admin.chartSignupsEmpty")}</p>
          ) : (
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
                  <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} angle={-35} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1b2e", border: "1px solid #ffffff22", borderRadius: 8 }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name={t("admin.chartSignupsBar")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-xiio-surface p-6">
          <h2 className="text-lg font-semibold text-white mb-2">{t("admin.chartPurposeTitle")}</h2>
          <p className="text-xs text-xiio-muted mb-4">{t("admin.chartPurposeTotal", { total: data.total })}</p>
          {pieData.length === 0 ? (
            <p className="text-xiio-muted text-sm">{t("admin.chartPurposeEmpty")}</p>
          ) : (
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={72}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.key} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1b2e", border: "1px solid #ffffff22", borderRadius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-sm">
            <div>
              <dt className="text-xiio-muted">{t("admin.purposeWatch")}</dt>
              <dd className="text-white font-semibold">{data.watch}</dd>
            </div>
            <div>
              <dt className="text-xiio-muted">{t("admin.purposeCollaborate")}</dt>
              <dd className="text-white font-semibold">{data.collaborate}</dd>
            </div>
            <div>
              <dt className="text-xiio-muted">{t("admin.purposeUpload")}</dt>
              <dd className="text-white font-semibold">{data.upload}</dd>
            </div>
            <div>
              <dt className="text-xiio-muted">{t("admin.purposeBoth")}</dt>
              <dd className="text-white font-semibold">{data.both}</dd>
            </div>
            <div>
              <dt className="text-xiio-muted">{t("admin.purposeOtherShort")}</dt>
              <dd className="text-white font-semibold">{data.other}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
