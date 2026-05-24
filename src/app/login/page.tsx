"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EMAIL_NOT_VERIFIED, useAuth, isAuthAccountConflict } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import KakaoScript from "@/components/auth/KakaoScript";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { auth } from "@/lib/firebase";
import { routeAfterAuth } from "@/lib/postAuthRoute";
import { loadRememberLogin, saveRememberLogin } from "@/lib/authPersistence";
import { formatLoginErrorMessage } from "@/lib/authErrors";
import type { SocialProviderKey } from "@/lib/authProviders";
import { formatSocialAuthError } from "@/lib/socialAuthClient";
import type { User } from "firebase/auth";

function LoginForm() {
  const { loginWithEmail, loginWithGoogle, loginWithApple, loginWithKakao, loginWithNaver } =
    useAuth();
  const { t } = useTranslations();
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

  const completeSocialLogin = async (signedIn: User) => {
    saveRememberLogin(rememberMe, email);
    await routeAfterAuth(signedIn.uid, router);
  };

  const runSocial = async (
    provider: SocialProviderKey,
    action: () => Promise<User> | void
  ) => {
    setError("");
    setLoading(true);
    try {
      saveRememberLogin(rememberMe, email);
      const result = action();
      if (result instanceof Promise) {
        const signedIn = await result;
        await completeSocialLogin(signedIn);
      }
    } catch (e) {
      if (isAuthAccountConflict(e)) return;
      const msg = formatSocialAuthError(e, t, provider, "login");
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
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
      await routeAfterAuth(current.uid, router);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === EMAIL_NOT_VERIFIED) {
        setError(t("auth.login.errorEmailNotVerified"));
      } else {
        setError(formatLoginErrorMessage(err, t));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-xiio-bg">
      <KakaoScript />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black tracking-widest text-white">
            X<span className="text-xiio-accent">II</span>O
          </Link>
        </div>

        <div className="bg-xiio-surface rounded-2xl p-8 border border-white/10">
          <h1 className="text-2xl font-bold text-white mb-6">{t("auth.login.title")}</h1>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm whitespace-pre-wrap break-words">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-xiio-muted mb-1.5">{t("auth.login.emailLabel")}</label>
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
              <label className="block text-sm text-xiio-muted mb-1.5">{t("auth.login.passwordLabel")}</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-xiio-accent focus:ring-xiio-accent focus:ring-offset-0"
              />
              <span className="text-sm text-xiio-muted">{t("auth.login.rememberMe")}</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-50 text-white font-semibold transition"
            >
              {loading ? t("auth.login.submitting") : t("auth.login.submit")}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-xiio-muted">
            {t("auth.login.noAccount")}{" "}
            <Link href="/signup" className="text-xiio-accent hover:underline font-medium">
              {t("common.signup")}
            </Link>
          </p>

          <div className="flex items-center gap-3 mt-6 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-xiio-muted">{t("common.or")}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <SocialAuthButtons
            layout="login"
            disabled={loading}
            onGoogle={() => void runSocial("google", () => loginWithGoogle(rememberMe))}
            onApple={() => void runSocial("apple", () => loginWithApple(rememberMe))}
            onKakao={() => void runSocial("kakao", () => loginWithKakao(rememberMe))}
            onNaver={() => void runSocial("naver", () => loginWithNaver(rememberMe))}
          />
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  const { t } = useTranslations();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-xiio-bg text-xiio-muted">
          {t("common.loading")}
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
