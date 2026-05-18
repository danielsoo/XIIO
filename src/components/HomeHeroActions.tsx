"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function HomeHeroActions() {
  const { user, loading } = useAuth();

  if (loading || user) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link
          href="/movies"
          className="inline-flex justify-center px-6 py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-semibold transition"
        >
          지금 시청하기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <Link
        href="/movies"
        className="inline-flex justify-center px-6 py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-semibold transition"
      >
        지금 시청하기
      </Link>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="inline-flex justify-center px-6 py-3 rounded-lg border border-white/30 text-white hover:bg-white/10 transition font-medium"
        >
          회원가입
        </Link>
        <Link
          href="/login"
          className="inline-flex justify-center px-6 py-3 rounded-lg border border-xiio-accent/50 text-xiio-accent hover:bg-xiio-accent/10 transition font-medium"
        >
          로그인
        </Link>
      </div>
    </div>
  );
}
