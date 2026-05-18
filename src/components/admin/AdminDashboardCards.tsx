"use client";

import Link from "next/link";

const CARDS = [
  {
    href: "/admin/onboarding",
    title: "온보딩·설문 통계",
    description: "가입 설문(platformPurpose) 비율·가입 추이 (PII 없이 집계)",
    ready: true,
  },
  {
    href: "/admin/users",
    title: "사용자",
    description: "회원·역할·제재 — 골격만 준비됨",
    ready: false,
  },
  {
    href: "/admin/content",
    title: "콘텐츠",
    description: "작품 심사·Stream 상태 — 골격만 준비됨",
    ready: false,
  },
  {
    href: "/admin/reports",
    title: "신고",
    description: "신고 큐 — 골격만 준비됨",
    ready: false,
  },
  {
    href: "/admin/payments",
    title: "결제·보증금",
    description: "PG·depositVerified 이벤트 — 골격만 준비됨",
    ready: false,
  },
];

export default function AdminDashboardCards() {
  return (
    <>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">대시보드</h1>
      <p className="text-xiio-muted text-sm mb-8">운영·통계 메뉴로 이동합니다.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`block rounded-2xl border p-6 transition shadow-lg ${
              card.ready
                ? "border-white/10 bg-xiio-surface hover:border-xiio-accent/40"
                : "border-dashed border-white/15 bg-white/[0.02] hover:border-white/25"
            }`}
          >
            <h2 className="text-lg font-bold text-white mb-2">{card.title}</h2>
            <p className="text-xiio-muted text-sm mb-4">{card.description}</p>
            <span className="text-xiio-accent text-sm font-medium">열기 →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
