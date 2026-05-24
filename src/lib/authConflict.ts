import type { AuthCredential } from "firebase/auth";
import {
  GoogleAuthProvider,
  OAuthProvider,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  firebaseProviderToSocialKey,
  type SocialProviderKey,
} from "@/lib/authProviders";

export const AUTH_ACCOUNT_CONFLICT = "AUTH_ACCOUNT_CONFLICT";

export type AccountConflictState = {
  email: string;
  existingProviderIds: string[];
  attemptedProvider: SocialProviderKey;
  pendingCredential: AuthCredential | null;
  pendingKakaoAccessToken: string | null;
  remember: boolean;
};

export function isAuthAccountConflict(err: unknown): boolean {
  return err instanceof Error && err.message === AUTH_ACCOUNT_CONFLICT;
}

export function credentialFromAuthError(err: unknown): AuthCredential | null {
  if (!err || typeof err !== "object") return null;
  return (
    OAuthProvider.credentialFromError(err as Parameters<typeof OAuthProvider.credentialFromError>[0]) ??
    GoogleAuthProvider.credentialFromError(
      err as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]
    )
  );
}

export function parseOAuthConflictError(
  err: unknown,
  attemptedProvider: SocialProviderKey,
  remember: boolean
): AccountConflictState | null {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code)
      : "";

  if (code !== "auth/account-exists-with-different-credential") return null;

  const customData =
    err && typeof err === "object" && "customData" in err
      ? (err as { customData?: { email?: string } }).customData
      : undefined;
  const email = customData?.email?.trim();
  if (!email) return null;

  const pendingCredential = credentialFromAuthError(err);

  return {
    email,
    existingProviderIds: [],
    attemptedProvider,
    pendingCredential,
    pendingKakaoAccessToken: null,
    remember,
  };
}

export async function enrichConflictWithSignInMethods(
  conflict: AccountConflictState
): Promise<AccountConflictState> {
  if (!auth || conflict.existingProviderIds.length > 0) return conflict;
  try {
    const methods = await fetchSignInMethodsForEmail(auth, conflict.email);
    return { ...conflict, existingProviderIds: methods };
  } catch {
    return conflict;
  }
}

export function primaryExistingSocialProvider(
  providerIds: string[]
): SocialProviderKey | "email" | null {
  const order: (SocialProviderKey | "email")[] = ["google", "apple", "kakao", "naver", "email"];
  for (const key of order) {
    const match = providerIds.find((id) => firebaseProviderToSocialKey(id) === key);
    if (match) return firebaseProviderToSocialKey(match);
  }
  return null;
}

export function providerLabelKey(provider: SocialProviderKey | "email"): string {
  if (provider === "email") return "auth.signup.providerEmail";
  return `auth.signup.provider${provider.charAt(0).toUpperCase()}${provider.slice(1)}` as const;
}
