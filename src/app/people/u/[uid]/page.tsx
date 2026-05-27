"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppPageShell from "@/components/layout/AppPageShell";
import { useTranslations } from "@/context/LocaleContext";

/** handle 없이 uid만 알 때 → 공개 프로필로 리다이렉트 */
export default function PeopleUidRedirectPage() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();
  const { t } = useTranslations();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    void fetch(`/api/people/by-uid/${encodeURIComponent(uid)}`)
      .then(async (res) => {
        if (!res.ok) {
          if (!cancelled) setFailed(true);
          return;
        }
        const data = (await res.json()) as { handle?: string };
        if (data.handle && !cancelled) {
          router.replace(`/people/${encodeURIComponent(data.handle)}`);
        } else if (!cancelled) {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, router]);

  return (
    <AppPageShell>
      <div className="py-16 text-center text-sm text-xiio-muted">
        {failed ? (
          <>
            <p>{t("network.people.notFound")}</p>
            <Link href="/messages" className="text-xiio-accent hover:underline mt-4 inline-block">
              {t("dm.back")}
            </Link>
          </>
        ) : (
          <p>{t("common.loading")}</p>
        )}
      </div>
    </AppPageShell>
  );
}
