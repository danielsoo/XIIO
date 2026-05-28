"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppPageShell from "@/components/layout/AppPageShell";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import type { CollabInvitePublicView } from "@/types/collab-invite";

export default function CollabInvitePage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslations();
  const { user, loading: authLoading } = useAuth();
  const [invite, setInvite] = useState<CollabInvitePublicView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const returnTo = useMemo(
    () => (token ? `/collab-invite/${encodeURIComponent(token)}` : "/"),
    [token]
  );

  useEffect(() => {
    if (typeof window !== "undefined" && returnTo) {
      sessionStorage.setItem("xiio-auth-return", returnTo);
    }
  }, [returnTo]);

  const loadInvite = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const headers: HeadersInit = {};
      if (user) {
        const idToken = await user.getIdToken();
        headers.Authorization = `Bearer ${idToken}`;
      }
      const res = await fetch(`/api/collab-invite/${encodeURIComponent(token)}`, { headers });
      if (!res.ok) {
        setInvite(null);
        setErr(
          res.status === 404 ? t("collabInvite.notFound") : t("collabInvite.loadError")
        );
        return;
      }
      const data = (await res.json()) as { invite?: CollabInvitePublicView };
      setInvite(data.invite ?? null);
    } catch {
      setErr(t("collabInvite.loadError"));
      setInvite(null);
    } finally {
      setLoading(false);
    }
  }, [token, user, t]);

  useEffect(() => {
    if (authLoading) return;
    void loadInvite();
  }, [authLoading, loadInvite]);

  const handleAccept = async () => {
    if (!user || !token || !invite?.canAccept) return;
    setAccepting(true);
    setErr(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/collab-invite/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = (await res.json()) as { error?: string; message?: string; alreadyAccepted?: boolean };
      if (!res.ok) {
        setErr(data.message ?? t("collabInvite.acceptError"));
        return;
      }
      setAccepted(true);
      if (data.alreadyAccepted) {
        setErr(null);
      }
      await loadInvite();
    } catch {
      setErr(t("collabInvite.acceptError"));
    } finally {
      setAccepting(false);
    }
  };

  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  const signupHref = `/signup?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <AppPageShell>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-white">{t("collabInvite.title")}</h1>

        {loading || authLoading ? (
          <p className="text-xiio-muted">{t("common.loading")}</p>
        ) : err && !invite ? (
          <p className="text-red-400">{err}</p>
        ) : !invite ? (
          <p className="text-red-400">{t("collabInvite.notFound")}</p>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-xiio-surface p-6 space-y-4">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xiio-muted">{t("collabInvite.workLabel")}</dt>
                <dd className="text-white font-medium">{invite.workTitle}</dd>
              </div>
              <div>
                <dt className="text-xiio-muted">{t("collabInvite.roleLabel")}</dt>
                <dd className="text-white">{t(`network.credits.role.${invite.role}`)}</dd>
              </div>
              {invite.characterName && (
                <div>
                  <dt className="text-xiio-muted">{t("network.credits.character")}</dt>
                  <dd className="text-white">{invite.characterName}</dd>
                </div>
              )}
              <div>
                <dt className="text-xiio-muted">{t("collabInvite.invitedBy")}</dt>
                <dd className="text-white">{invite.ownerDisplayName}</dd>
              </div>
              <div>
                <dt className="text-xiio-muted">{t("collabInvite.invitedEmail")}</dt>
                <dd className="text-white">{invite.invitedEmailMasked}</dd>
              </div>
              {invite.expiresAt && (
                <div>
                  <dt className="text-xiio-muted">{t("collabInvite.expires")}</dt>
                  <dd className="text-white">{new Date(invite.expiresAt).toLocaleString()}</dd>
                </div>
              )}
            </dl>

            {accepted || invite.status === "accepted" ? (
              <p className="text-emerald-300 text-sm">
                {invite.status === "accepted" && !accepted
                  ? t("collabInvite.alreadyAccepted")
                  : t("collabInvite.accepted")}
              </p>
            ) : invite.status === "expired" ? (
              <p className="text-amber-400/90 text-sm">{t("collabInvite.expired")}</p>
            ) : invite.acceptBlockReason === "login_required" ? (
              <div className="space-y-3">
                <p className="text-sm text-xiio-muted">{t("collabInvite.loginRequired")}</p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={loginHref}
                    className="inline-flex px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm font-medium hover:bg-xiio-accent-hover transition"
                  >
                    {t("collabInvite.login")}
                  </Link>
                  <Link
                    href={signupHref}
                    className="inline-flex px-4 py-2 rounded-lg border border-white/15 text-white text-sm hover:bg-white/5 transition"
                  >
                    {t("collabInvite.signup")}
                  </Link>
                </div>
              </div>
            ) : invite.acceptBlockReason === "email_mismatch" ? (
              <p className="text-amber-400/90 text-sm">
                {t("collabInvite.emailMismatch")
                  .replace("{invited}", invite.invitedEmailMasked)
                  .replace("{current}", invite.viewerEmail ?? "—")}
              </p>
            ) : invite.canAccept ? (
              <button
                type="button"
                onClick={() => void handleAccept()}
                disabled={accepting}
                className="w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-50 text-white font-semibold transition"
              >
                {accepting ? t("collabInvite.accepting") : t("collabInvite.accept")}
              </button>
            ) : (
              <p className="text-amber-400/90 text-sm">{t("collabInvite.notPending")}</p>
            )}

            {err && invite && <p className="text-red-400 text-sm">{err}</p>}
          </div>
        )}

        <Link href="/" className="text-sm text-xiio-accent hover:underline">
          {t("collabInvite.goHome")}
        </Link>
      </div>
    </AppPageShell>
  );
}
