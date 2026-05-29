"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";

type MemberAccessKind = "active" | "no_profile" | "deleted";

export default function UploaderMemberGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslations();
  const [kind, setKind] = useState<MemberAccessKind | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setKind(null);
      setChecked(true);
      return;
    }

    let cancelled = false;
    setChecked(false);
    void (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/me/member-access", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as { kind?: MemberAccessKind };
        if (cancelled) return;
        const accessKind = data.kind ?? "no_profile";
        setKind(accessKind);
        if (accessKind === "no_profile") {
          router.replace("/signup");
        }
      } catch {
        if (!cancelled) setKind("no_profile");
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  if (authLoading || (user && !checked)) {
    return (
      <main className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
        <p className="text-xiio-muted">{t("common.loading")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white">{t("uploader.uploadLoginRequired")}</p>
        <Link href="/login" className="text-xiio-accent hover:underline">
          {t("common.login")}
        </Link>
      </main>
    );
  }

  if (kind === "deleted") {
    return (
      <main className="min-h-screen bg-xiio-bg flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-xl font-semibold text-white">{t("uploader.profileRequiredTitle")}</h1>
        <p className="text-xiio-muted text-sm text-center max-w-md">{t("uploader.accountDeletedBody")}</p>
        <Link href="/" className="text-xiio-accent hover:underline text-sm">
          {t("common.goHome")}
        </Link>
      </main>
    );
  }

  if (kind === "no_profile") {
    return (
      <main className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
        <p className="text-xiio-muted">{t("common.loading")}</p>
      </main>
    );
  }

  if (kind !== "active") {
    return (
      <main className="min-h-screen bg-xiio-bg flex items-center justify-center text-white">
        <p className="text-xiio-muted">{t("common.loading")}</p>
      </main>
    );
  }

  return <>{children}</>;
}
