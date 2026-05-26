"use client";

import { useMemo, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  type User,
} from "firebase/auth";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const REMOVED_KEYS = [
  "itemProfileRemoved",
  "itemPeopleHidden",
  "itemPiiRemoved",
  "itemWatchProfilesRemoved",
  "itemUnpublishedWorksDeleted",
  "itemPortfolioSharesRemoved",
  "itemActivityRemoved",
  "itemFollowsRemoved",
  "itemBlocksRemoved",
  "itemDmRemoved",
  "itemAvatarStorageRemoved",
  "itemBillingRemoved",
  "itemPendingRequestsCancelled",
] as const;

const RETAINED_KEYS = [
  "itemPublishedWorksRemain",
  "itemWatchUrlsRemain",
  "itemDirectorCreditNamesRemain",
  "itemCreditsOnOthersWorksRemain",
  "itemPaymentEventsRetained",
  "itemReportsAuditRetained",
  "itemModerationRetained",
] as const;

function DisclosureSection({
  title,
  items,
  t,
  variant,
}: {
  title: string;
  items: readonly string[];
  t: (key: string) => string;
  variant: "removed" | "retained" | "default";
}) {
  const titleCls =
    variant === "retained"
      ? "text-amber-200/90"
      : variant === "removed"
        ? "text-red-300/90"
        : "text-white/90";
  return (
    <section className="mb-4">
      <h3 className={`text-sm font-semibold mb-2 ${titleCls}`}>{title}</h3>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-xiio-muted leading-relaxed">
        {items.map((key) => (
          <li key={key}>{t(`settings.deleteAccount.${key}`)}</li>
        ))}
      </ul>
    </section>
  );
}

function isEmailPasswordUser(user: User): boolean {
  return user.providerData.some((p) => p.providerId === "password");
}

export default function AccountDeleteDialog({ open, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [agreed, setAgreed] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedPhrase = t("settings.deleteAccount.confirmPhraseExpected");
  const phraseOk = phrase.trim() === expectedPhrase;
  const needsPassword = user ? isEmailPasswordUser(user) : false;
  const canSubmit = agreed && phraseOk && (!needsPassword || password.length > 0) && !busy;

  const accountItems = useMemo(
    () => ["itemAuthDeleted", "itemAuthLinksRemoved", "itemNoServiceAccess"],
    []
  );
  const recoveryItems = useMemo(
    () => ["itemNoRecovery", "itemReregisterRequired", "itemHandleMayBeReused"],
    []
  );
  const notesItems = useMemo(
    () => ["itemAdminCannotDelete", "itemPartialFailure", "itemLogoutAfterDelete"],
    []
  );

  if (!open) return null;

  const resetForm = () => {
    setAgreed(false);
    setPhrase("");
    setPassword("");
    setError(null);
  };

  const handleClose = () => {
    if (busy) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setBusy(true);
    setError(null);

    try {
      if (needsPassword) {
        if (!user.email) {
          setError(t("settings.deleteAccount.errorGeneric"));
          setBusy(false);
          return;
        }
        const cred = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, cred);
      }

      const token = await user.getIdToken();
      const res = await fetch("/api/me/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmPhrase: phrase.trim() }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        if (body.error === "admin_cannot_delete") {
          setError(t("settings.deleteAccount.errorAdmin"));
        } else if (body.error === "auth_delete_failed") {
          setError(body.message ?? t("settings.deleteAccount.errorGeneric"));
        } else {
          setError(body.message ?? t("settings.deleteAccount.errorGeneric"));
        }
        setBusy(false);
        return;
      }

      resetForm();
      onSuccess();
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "auth/requires-recent-login") {
        setError(t("settings.deleteAccount.errorRecentLogin"));
      } else if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError(t("settings.deleteAccount.errorWrongPassword"));
      } else {
        setError(t("settings.deleteAccount.errorGeneric"));
      }
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-delete-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-xiio-surface shadow-xl flex flex-col max-h-[90vh]">
        <div className="p-6 pb-0 shrink-0">
          <h2 id="account-delete-title" className="text-lg font-bold text-white mb-2">
            {t("settings.deleteAccount.dialogTitle")}
          </h2>
        </div>

        <div className="px-6 py-3 overflow-y-auto max-h-[min(60vh,28rem)] shrink min-h-0">
          <p className="text-sm text-xiio-muted mb-4 leading-relaxed">
            {t("settings.deleteAccount.dialogLead")}
          </p>

          <DisclosureSection
            title={t("settings.deleteAccount.sectionAccount")}
            items={accountItems}
            t={t}
            variant="default"
          />
          <DisclosureSection
            title={t("settings.deleteAccount.sectionRemoved")}
            items={REMOVED_KEYS}
            t={t}
            variant="removed"
          />
          <DisclosureSection
            title={t("settings.deleteAccount.sectionRetained")}
            items={RETAINED_KEYS}
            t={t}
            variant="retained"
          />
          <DisclosureSection
            title={t("settings.deleteAccount.sectionRecovery")}
            items={recoveryItems}
            t={t}
            variant="default"
          />
          <DisclosureSection
            title={t("settings.deleteAccount.sectionNotes")}
            items={notesItems}
            t={t}
            variant="default"
          />
        </div>

        <div className="p-6 pt-4 border-t border-white/10 shrink-0 space-y-4">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={busy}
              className="mt-1 rounded border-white/20"
            />
            <span className="text-sm text-white leading-snug">
              {t("settings.deleteAccount.confirmCheckbox")}
            </span>
          </label>

          <div>
            <label className="block text-xs text-xiio-muted mb-1.5">
              {t("settings.deleteAccount.confirmPhraseLabel")}
            </label>
            <input
              type="text"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={t("settings.deleteAccount.confirmPhrasePlaceholder")}
              disabled={busy}
              autoComplete="off"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-400/50"
            />
          </div>

          {needsPassword && (
            <div>
              <label className="block text-xs text-xiio-muted mb-1.5">
                {t("settings.deleteAccount.passwordLabel")}
              </label>
              <PasswordInput
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={busy}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              className="flex-1 py-2.5 rounded-lg border border-white/20 text-white hover:bg-white/5 disabled:opacity-50 text-sm font-medium transition"
            >
              {t("settings.deleteAccount.cancel")}
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
              className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-semibold transition"
            >
              {busy ? t("settings.deleteAccount.submitting") : t("settings.deleteAccount.submit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
