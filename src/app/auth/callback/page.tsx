"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { applyAuthPersistence } from "@/lib/authPersistence";
import { routeAfterAuth } from "@/lib/postAuthRoute";
import { formatAuthCallbackError } from "@/lib/socialAuthClient";
import { useTranslations } from "@/context/LocaleContext";

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslations();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const errCode = searchParams.get("error");

    if (errCode) {
      setError(formatAuthCallbackError(errCode, t));
      return;
    }

    if (!token) {
      setError(t("auth.login.errorNaverFailed"));
      return;
    }

    if (!auth) {
      setError(t("auth.signup.errorFirebaseNotConfigured"));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await applyAuthPersistence(true);
        await signInWithCustomToken(auth, token);
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error("no user");
        if (!cancelled) {
          await routeAfterAuth(uid, router);
        }
      } catch {
        if (!cancelled) {
          setError(t("auth.login.errorNaverFailed"));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, t]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-xiio-bg">
      <div className="w-full max-w-md text-center">
        {error ? (
          <div className="bg-xiio-surface rounded-2xl p-8 border border-white/10">
            <p className="text-red-400 text-sm mb-6">{error}</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-semibold transition"
            >
              {t("auth.signup.verifyDoneCta")}
            </Link>
          </div>
        ) : (
          <p className="text-xiio-muted">{t("common.loading")}</p>
        )}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  const { t } = useTranslations();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-xiio-bg text-xiio-muted">
          {t("common.loading")}
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
