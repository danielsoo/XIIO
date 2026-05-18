"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDepositStatus } from "@/hooks/useDepositStatus";

export default function UploaderUploadInner() {
  const { user, loading: authLoading } = useAuth();
  const { depositVerified, depositEnabled, checked } = useDepositStatus();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const needsDeposit = depositEnabled && !depositVerified;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const fileInput = (e.target as HTMLFormElement).elements.namedItem("video") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setErr("영상 파일을 선택해 주세요.");
      return;
    }

    setErr(null);
    setBusy(true);
    setDone(null);

    try {
      const token = await user.getIdToken();
      const sessionRes = await fetch("/api/stream/upload-url", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: title || file.name }),
      });
      const sessionData = await sessionRes.json().catch(() => ({}));
      if (!sessionRes.ok) {
        const code = (sessionData as { error?: string }).error;
        if (code === "deposit_required") {
          setErr("업로드하려면 먼저 업로더 보증금(소액 결제)을 완료해 주세요.");
        } else {
          setErr(code ?? `오류 ${sessionRes.status}`);
        }
        return;
      }

      const uploadURL = (sessionData as { uploadURL?: string }).uploadURL;
      if (!uploadURL) {
        setErr("업로드 URL을 받지 못했습니다.");
        return;
      }

      const form = new FormData();
      form.append("file", file);

      const uploadRes = await fetch(uploadURL, { method: "POST", body: form });
      if (!uploadRes.ok) {
        setErr("Cloudflare Stream 업로드에 실패했습니다.");
        return;
      }

      setDone("업로드가 접수되었습니다. 인코딩이 끝나면 시청 가능 상태로 전환됩니다.");
      setTitle("");
      fileInput.value = "";
    } catch {
      setErr("업로드 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || !checked) {
    return (
      <main className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
        <p className="text-xiio-muted">불러오는 중…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white">로그인이 필요합니다.</p>
        <Link href="/login" className="text-xiio-accent hover:underline">
          로그인
        </Link>
      </main>
    );
  }

  if (needsDeposit) {
    return (
      <main className="min-h-screen bg-xiio-bg flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-xiio-surface p-8">
          <h1 className="text-2xl font-bold text-white mb-2">업로드 보증금 필요</h1>
          <p className="text-xiio-muted text-sm mb-6">
            영상 업로드는 보증금(소액 결제) 완료 후 가능합니다. 신원 보증이 아닌 스팸 완화 목적입니다.
          </p>
          <Link
            href="/uploader/verify"
            className="block w-full text-center py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-medium transition"
          >
            보증금 결제하기
          </Link>
          <Link href="/" className="block text-center text-sm text-xiio-muted hover:text-white mt-6 transition">
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-xiio-bg flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-xiio-surface p-8">
        <h1 className="text-2xl font-bold text-white mb-2">영상 업로드</h1>
        <p className="text-xiio-muted text-sm mb-6">
          Cloudflare Stream으로 업로드됩니다. 제목을 입력하고 mp4 등 영상 파일을 선택하세요.
        </p>

        {done && (
          <div className="mb-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-emerald-400 text-sm">
            {done}
          </div>
        )}
        {err && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-400 text-sm">
            {err}
          </div>
        )}

        <form onSubmit={(e) => void handleUpload(e)} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-xiio-muted mb-1.5">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="작품 제목"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-xiio-muted mb-1.5">영상 파일</label>
            <input
              name="video"
              type="file"
              accept="video/*"
              required
              className="w-full text-sm text-xiio-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-xiio-accent file:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-40 text-white font-medium transition"
          >
            {busy ? "업로드 중…" : "업로드"}
          </button>
        </form>

        <Link href="/" className="block text-center text-sm text-xiio-muted hover:text-white mt-6 transition">
          홈으로
        </Link>
      </div>
    </main>
  );
}
