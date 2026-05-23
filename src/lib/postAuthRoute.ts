import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { resolvePostLoginPath } from "@/lib/activeWatchProfile";
import { getPostAuthPath, getUserProfile, markEmailVerified } from "@/lib/userProfile";

export type PostAuthRouter = {
  push: (path: string) => void;
};

/** 로그인·OAuth 콜백 후 공통 라우팅 */
export async function routeAfterAuth(uid: string, router: PostAuthRouter): Promise<void> {
  const profile = await getUserProfile(uid);

  if (!profile) {
    router.push("/signup");
    return;
  }

  const authUser = auth?.currentUser;
  if (authUser?.emailVerified && !profile.emailVerified) {
    await markEmailVerified(uid);
  }

  router.push(resolvePostLoginPath(uid, await getPostAuthPath(uid)));
}

export function getCurrentAuthUid(): string | null {
  return auth?.currentUser?.uid ?? null;
}

export type { User };
