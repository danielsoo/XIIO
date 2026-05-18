"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
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

const PIE_COLORS = ["#6366f1", "#a855f7", "#64748b"];

export default function OnboardingStatsContent() {
  const { user } = useAuth();
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
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const json = (await res.json()) as OnboardingStatsPayload;
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

  if (loading) {
    return <p className="text-xiio-muted">통계를 불러오는 중…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
        통계를 불러오지 못했습니다: {error}
      </div>
    );
  }

  if (!data) return null;

  const pieData = [
    { name: "시청", value: data.watch, key: "watch" },
    { name: "업로드(설문)", value: data.upload, key: "upload" },
    { name: "기타/미입력", value: data.other, key: "other" },
  ].filter((d) => d.value > 0);

  const dailyEntries = Object.entries(data.signupsByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const dailyChart = dailyEntries.slice(-30);

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-xiio-muted hover:text-xiio-accent transition mb-4 inline-block">
          ← 대시보드
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white">온보딩·설문 통계</h1>
        <p className="text-xiio-muted text-sm mt-2">
          Firestore <code className="text-white/70">users</code> 컬렉션의{" "}
          <code className="text-white/70">platformPurpose</code> 필드 기준 집계입니다. 개인 식별 정보는 표시하지 않습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-xiio-surface p-6">
          <h2 className="text-lg font-semibold text-white mb-4">가입 추이 (최근 30일, UTC 일자 기준)</h2>
          {dailyChart.length === 0 ? (
            <p className="text-xiio-muted text-sm">날짜별 데이터가 없습니다. <code>createdAt</code>이 있는 문서만 집계됩니다.</p>
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
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="가입 수" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-xiio-surface p-6">
          <h2 className="text-lg font-semibold text-white mb-2">플랫폼 목적 비율</h2>
          <p className="text-xs text-xiio-muted mb-4">총 {data.total}명</p>
          {pieData.length === 0 ? (
            <p className="text-xiio-muted text-sm">데이터 없음</p>
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
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <dt className="text-xiio-muted">시청</dt>
              <dd className="text-white font-semibold">{data.watch}</dd>
            </div>
            <div>
              <dt className="text-xiio-muted">업로드</dt>
              <dd className="text-white font-semibold">{data.upload}</dd>
            </div>
            <div>
              <dt className="text-xiio-muted">기타</dt>
              <dd className="text-white font-semibold">{data.other}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
