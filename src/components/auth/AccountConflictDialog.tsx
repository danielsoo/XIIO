"use client";

import { useTranslations } from "@/context/LocaleContext";
import type { AccountConflictState } from "@/lib/authConflict";
import { primaryExistingSocialProvider, providerLabelKey } from "@/lib/authConflict";
import type { SocialProviderKey } from "@/lib/authProviders";

const ATTEMPTED_LABEL_KEYS: Record<SocialProviderKey, string> = {
  google: "auth.signup.providerGoogle",
  apple: "auth.signup.providerApple",
  kakao: "auth.signup.providerKakao",
  naver: "auth.signup.providerNaver",
};

type Props = {
  conflict: AccountConflictState;
  busy?: boolean;
  onLoginExisting: () => void;
  onLinkAccounts: () => void;
  onCancel: () => void;
};

export default function AccountConflictDialog({
  conflict,
  busy = false,
  onLoginExisting,
  onLinkAccounts,
  onCancel,
}: Props) {
  const { t } = useTranslations();

  const existingKey =
    primaryExistingSocialProvider(conflict.existingProviderIds) ?? "google";
  const existingLabel = t(providerLabelKey(existingKey));
  const attemptedLabel = t(ATTEMPTED_LABEL_KEYS[conflict.attemptedProvider]);
  const isEmailExisting = existingKey === "email";

  const canLink =
    !isEmailExisting &&
    (conflict.pendingCredential != null || conflict.pendingKakaoAccessToken != null);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-conflict-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-xiio-surface p-6 shadow-xl">
        <h2 id="account-conflict-title" className="text-lg font-bold text-white mb-2">
          {t("auth.conflict.title")}
        </h2>
        <p className="text-sm text-xiio-muted mb-6 whitespace-pre-wrap">
          {t("auth.conflict.body", {
            email: conflict.email,
            existingProvider: existingLabel,
            attemptedProvider: attemptedLabel,
          })}
        </p>

        <div className="flex flex-col gap-2.5">
          {isEmailExisting ? (
            <p className="text-sm text-xiio-muted">{t("auth.conflict.useEmailLogin")}</p>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onLoginExisting}
              className="w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-50 text-white font-semibold transition"
            >
              {t("auth.conflict.loginExisting", { provider: existingLabel })}
            </button>
          )}

          {canLink ? (
            <button
              type="button"
              disabled={busy}
              onClick={onLinkAccounts}
              className="w-full py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 disabled:opacity-50 font-medium transition"
            >
              {t("auth.conflict.linkAccounts", { provider: attemptedLabel })}
            </button>
          ) : null}

          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="w-full py-2.5 text-sm text-xiio-muted hover:text-white transition"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
