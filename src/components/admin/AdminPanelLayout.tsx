"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const NAV = [
  { href: "/admin", label: "대시보드", exact: true },
  { href: "/admin/onboarding", label: "온보딩·설문" },
  { href: "/admin/users", label: "사용자" },
  { href: "/admin/content", label: "콘텐츠" },
  { href: "/admin/reports", label: "신고" },
  { href: "/admin/payments", label: "결제" },
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { isAdmin, isSuperAdmin, checked, reason } = useAdminAccess();

  if (loading || !checked) {
    return (
      <div className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
        <p className="text-xiio-muted">불러오는 중…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-white text-lg">어드민 패널은 로그인 후 이용할 수 있습니다.</p>
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-medium transition"
        >
          로그인
        </Link>
        <Link href="/" className="text-sm text-xiio-muted hover:text-white transition">
          ← 홈으로
        </Link>
      </div>
    );
  }

  if (reason === "admin_sdk_missing") {
    return (
      <div className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4 px-4 max-w-lg mx-auto text-center">
        <p className="text-amber-400 font-medium">서버 설정 필요</p>
        <p className="text-xiio-muted text-sm">
          Firebase Admin SDK가 구성되지 않았습니다. 배포 환경에{" "}
          <code className="text-white/80">FIREBASE_SERVICE_ACCOUNT_JSON</code> 등을 설정한 뒤 다시 시도하세요.
        </p>
        <Link href="/" className="text-sm text-xiio-accent hover:underline">
          홈으로
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-red-400">이 계정은 어드민 권한이 없습니다.</p>
        <Link href="/" className="text-sm text-xiio-muted hover:text-white transition">
          ← 홈으로
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-xiio-bg flex flex-col md:flex-row">
      <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-black/40">
        <div className="p-4 border-b border-white/10">
          <Link href="/admin" className="text-lg font-black tracking-widest text-white">
            X<span className="text-xiio-accent">II</span>O
          </Link>
          <p className="text-xs text-xiio-muted mt-1">
            {isSuperAdmin ? "Super Admin" : "Admin"}
          </p>
        </div>
        <nav className="p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {NAV.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`block px-3 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                  active ? "bg-xiio-accent/20 text-white" : "text-xiio-muted hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-auto border-t border-white/10 hidden md:block">
          <Link href="/" className="text-sm text-xiio-muted hover:text-xiio-accent transition">
            ← 사이트로 돌아가기
          </Link>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
    </div>
  );
}
