import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { resolvePostLoginPath } from "@/lib/activeWatchProfile";
import {
  fetchUserProfileWithRetry,
  isProfileComplete,
  markEmailVerified,
} from "@/lib/userProfile";

export type PostAuthRouter = {
  push: (path: string) => void;
};

/** 로그인·OAuth 콜백 후 공통 라우팅 */
export async function routeAfterAuth(uid: string, router: PostAuthRouter): Promise<void> {
  const result = await fetchUserProfileWithRetry(uid);

  if (result.status === "error") {
    router.push("/");
    return;
  }

  if (result.status === "missing") {
    router.push("/signup");
    return;
  }

  const profile = result.profile;
  const authUser = auth?.currentUser;
  if (authUser?.emailVerified && !profile.emailVerified) {
    await markEmailVerified(uid);
  }

  router.push(
    resolvePostLoginPath(uid, isProfileComplete(profile) ? "/" : "/signup")
  );
}

export function getCurrentAuthUid(): string | null {
  return auth?.currentUser?.uid ?? null;
}

export type { User };
