"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDepositStatus } from "@/hooks/useDepositStatus";

export default function UploaderVerifyInner() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const { depositVerified, depositEnabled, checked, refresh } = useDepositStatus();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (status === "success" && user) {
      void refresh();
    }
  }, [status, user, refresh]);

  const startDeposit = async () => {
    if (!user) return;
    setErr(null);
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/payments/uploader-deposit/session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ region: "AUTO" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((data as { error?: string }).error ?? `오류 ${res.status}`);
        return;
      }
      if ((data as { url?: string }).url) {
        window.location.href = (data as { url: string }).url;
        return;
      }
      setErr("결제 세션 URL을 받지 못했습니다. STRIPE_SECRET_KEY를 확인하세요.");
    } catch {
      setErr("요청에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !checked) {
    return (
      <main className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
        <p className="text-xiio-muted">불러오는 중…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white">업로더 보증금을 위해 로그인해 주세요.</p>
        <Link href="/login" className="text-xiio-accent hover:underline">
          로그인
        </Link>
      </main>
    );
  }

  if (depositVerified) {
    return (
      <main className="min-h-screen bg-xiio-bg flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-xiio-surface p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">보증금 완료</h1>
          <p className="text-xiio-muted text-sm mb-6">
            업로드 자격이 활성화되었습니다. (신원 보증이 아닌 스팸 완화 목적)
          </p>
          <Link
            href="/uploader/upload"
            className="block w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-medium transition"
          >
            영상 업로드하기
          </Link>
          <Link href="/" className="block text-sm text-xiio-muted hover:text-white mt-6 transition">
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-xiio-bg flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-xiio-surface p-8">
        <h1 className="text-2xl font-bold text-white mb-2">업로더 보증금</h1>
        <p className="text-xiio-muted text-sm mb-6">
          영상 업로드를 위해 소액 결제가 필요합니다. prepaid·도용 카드 등은 막을 수 없으며, 스팸·일회성 계정 완화 목적입니다.
        </p>

        {status === "success" && (
          <div className="mb-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-emerald-400 text-sm">
            결제가 완료되면 잠시 후 새로고침하세요. 웹훅 처리 후 업로드 자격이 반영됩니다.
          </div>
        )}
        {status === "cancel" && (
          <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-amber-400 text-sm">
            결제가 취소되었습니다.
          </div>
        )}

        {!depositEnabled && (
          <div className="mb-4 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xiio-muted text-sm">
            현재 보증금 결제가 꺼져 있습니다 (<code className="text-white/70">UPLOADER_DEPOSIT_ENABLED</code>).
          </div>
        )}

        {err && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-400 text-sm">
            {err}
          </div>
        )}

        <button
          type="button"
          disabled={busy || !depositEnabled}
          onClick={() => void startDeposit()}
          className="w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-40 text-white font-medium transition"
        >
          {busy ? "처리 중…" : "보증금 결제하기"}
        </button>
        <button
          type="button"
          onClick={() => void refresh()}
          className="w-full mt-3 py-2 rounded-lg border border-white/20 text-sm text-white hover:bg-white/5 transition"
        >
          결제 상태 새로고침
        </button>

        <Link href="/" className="block text-center text-sm text-xiio-muted hover:text-white mt-6 transition">
          홈으로
        </Link>
      </div>
    </main>
  );
}
