"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EMAIL_NOT_VERIFIED, useAuth } from "@/context/AuthContext";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { auth } from "@/lib/firebase";
import {
  createGoogleMemberProfile,
  getPostAuthPath,
  getUserProfile,
  markEmailVerified,
} from "@/lib/userProfile";
import { loadRememberLogin, saveRememberLogin } from "@/lib/authPersistence";

function LoginForm() {
  const { loginWithEmail, loginWithGoogle, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { remember, email: savedEmail } = loadRememberLogin();
    setRememberMe(remember);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const routeAfterAuth = async (
    uid: string,
    userEmail: string | null,
    displayName: string | null,
    isGoogle: boolean
  ) => {
    let profile = await getUserProfile(uid);

    if (!profile && isGoogle) {
      await createGoogleMemberProfile(uid, userEmail, displayName);
      profile = await getUserProfile(uid);
    }

    if (!profile) {
      await logout();
      setError("회원 정보가 없습니다. 회원가입을 먼저 진행해주세요.");
      return;
    }

    const authUser = auth?.currentUser;
    if (authUser?.emailVerified && !profile.emailVerified) {
      await markEmailVerified(uid);
    }

    router.push(await getPostAuthPath(uid));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      saveRememberLogin(rememberMe, email);
      await loginWithEmail(email, password, rememberMe);
      const current = auth?.currentUser;
      if (!current) throw new Error("no user");
      await routeAfterAuth(current.uid, current.email, current.displayName, false);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === EMAIL_NOT_VERIFIED) {
        setError("이메일 인증이 완료되지 않았습니다. 메일함에서 인증 링크를 확인한 뒤 다시 로그인해주세요.");
      } else {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      saveRememberLogin(rememberMe, email);
      const googleUser = await loginWithGoogle(rememberMe);
      await routeAfterAuth(
        googleUser.uid,
        googleUser.email,
        googleUser.displayName,
        true
      );
    } catch {
      setError("Google 로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-xiio-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black tracking-widest text-white">
            X<span className="text-xiio-accent">II</span>O
          </Link>
        </div>

        <div className="bg-xiio-surface rounded-2xl p-8 border border-white/10">
          <h1 className="text-2xl font-bold text-white mb-6">로그인</h1>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-xiio-muted mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="example@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent transition"
              />
            </div>

            <div>
              <label className="block text-sm text-xiio-muted mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent transition"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-xiio-accent focus:ring-xiio-accent focus:ring-offset-0"
              />
              <span className="text-sm text-xiio-muted">로그인 정보 기억하기</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-50 text-white font-semibold transition"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-xiio-muted">
            아직 회원이 아니신가요?{" "}
            <Link href="/signup" className="text-xiio-accent hover:underline font-medium">
              회원가입
            </Link>
          </p>

          <div className="flex items-center gap-3 mt-6 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-xiio-muted">또는</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={loading}
            className="w-full py-3 rounded-lg border border-white/20 text-white font-medium flex items-center justify-center gap-3 hover:bg-white/5 disabled:opacity-50 transition"
          >
            <GoogleIcon />
            Google로 로그인
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-xiio-bg text-xiio-muted">
          불러오는 중…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
