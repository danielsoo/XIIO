"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  signInWithCustomToken,
  updateProfile,
  sendEmailVerification,
  deleteUser,
} from "firebase/auth";
import { auth, appleProvider, googleProvider } from "@/lib/firebase";
import { applyAuthPersistence } from "@/lib/authPersistence";
import { hasUserProfile, saveUserProfile } from "@/lib/userProfile";
import type { SignupProfile } from "@/types/user";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string, remember?: boolean) => Promise<void>;
  signupWithEmail: (email: string, password: string, profile: SignupProfile) => Promise<void>;
  resumeEmailSignup: (
    email: string,
    password: string,
    profile: SignupProfile
  ) => Promise<{ needsVerification: boolean }>;
  loginWithGoogle: (remember?: boolean) => Promise<User>;
  loginWithApple: (remember?: boolean) => Promise<User>;
  loginWithKakao: (remember?: boolean) => Promise<User>;
  loginWithNaver: (remember?: boolean) => void;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<boolean>;
}

export const EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED";
export const SIGNUP_VERIFY_EMAIL_FAILED = "SIGNUP_VERIFY_EMAIL_FAILED";

const AuthContext = createContext<AuthContextType | null>(null);

async function rollbackAuthUser(user: User | null) {
  if (!user) return;
  try {
    await deleteUser(user);
  } catch {
    // ignore
  }
}

function ensureKakaoReady(): void {
  const key = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim();
  if (!key) throw new Error("KAKAO_NOT_CONFIGURED");
  if (!window.Kakao?.isInitialized()) {
    window.Kakao?.init(key);
  }
  if (!window.Kakao?.isInitialized()) {
    throw new Error("KAKAO_NOT_READY");
  }
}

async function signInWithKakaoAccessToken(accessToken: string): Promise<void> {
  if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");

  const res = await fetch("/api/auth/kakao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (body.error === "account_exists") {
      const err = new Error("account_exists");
      Object.assign(err, { code: "auth/account-exists-with-different-credential" });
      throw err;
    }
    if (body.error === "admin_not_configured") {
      throw new Error("ADMIN_NOT_CONFIGURED");
    }
    throw new Error("KAKAO_AUTH_FAILED");
  }

  const { customToken } = (await res.json()) as { customToken: string };
  await signInWithCustomToken(auth, customToken);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, password: string, remember = true) => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    await applyAuthPersistence(remember);
    await signInWithEmailAndPassword(auth, email, password);
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.emailVerified) {
      await sendEmailVerification(currentUser);
      await signOut(auth);
      throw new Error(EMAIL_NOT_VERIFIED);
    }
  };

  const resumeEmailSignup = async (
    email: string,
    password: string,
    profile: SignupProfile
  ): Promise<{ needsVerification: boolean }> => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    await signInWithEmailAndPassword(auth, email, password);
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("로그인에 실패했습니다.");

    await updateProfile(currentUser, { displayName: profile.displayName });
    const exists = await hasUserProfile(currentUser.uid);
    if (!exists) {
      await saveUserProfile(currentUser.uid, profile, currentUser.email, {
        emailVerified: currentUser.emailVerified,
      });
    }

    if (!currentUser.emailVerified) {
      try {
        await sendEmailVerification(currentUser);
      } catch {
        throw new Error(SIGNUP_VERIFY_EMAIL_FAILED);
      }
      return { needsVerification: true };
    }

    return { needsVerification: false };
  };

  const signupWithEmail = async (email: string, password: string, profile: SignupProfile) => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");

    let newUser: User | null = null;
    let profileSaved = false;

    try {
      const { user: created } = await createUserWithEmailAndPassword(auth, email, password);
      newUser = created;
      await updateProfile(newUser, { displayName: profile.displayName });
      await saveUserProfile(newUser.uid, profile, newUser.email);
      profileSaved = true;

      try {
        await sendEmailVerification(newUser);
      } catch {
        throw new Error(SIGNUP_VERIFY_EMAIL_FAILED);
      }
    } catch (err) {
      if (newUser && !profileSaved) {
        await rollbackAuthUser(newUser);
      }
      throw err;
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth?.currentUser) throw new Error("로그인 세션이 없습니다.");
    await sendEmailVerification(auth.currentUser);
  };

  const reloadUser = async (): Promise<boolean> => {
    if (!auth?.currentUser) return false;
    await auth.currentUser.reload();
    return auth.currentUser.emailVerified;
  };

  const loginWithGoogle = async (remember = true) => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    await applyAuthPersistence(remember);
    const { user: signedIn } = await signInWithPopup(auth, googleProvider);
    return signedIn;
  };

  const loginWithApple = async (remember = true) => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    await applyAuthPersistence(remember);
    const { user: signedIn } = await signInWithPopup(auth, appleProvider);
    return signedIn;
  };

  const loginWithKakao = async (remember = true) => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    await applyAuthPersistence(remember);
    ensureKakaoReady();

    return new Promise<User>((resolve, reject) => {
      window.Kakao!.Auth.login({
        success: ({ access_token }) => {
          void (async () => {
            try {
              if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
              await signInWithKakaoAccessToken(access_token);
              const current = auth.currentUser;
              if (!current) throw new Error("로그인에 실패했습니다.");
              resolve(current);
            } catch (e) {
              reject(e);
            }
          })();
        },
        fail: (err) => reject(err),
      });
    });
  };

  const loginWithNaver = (remember = true) => {
    if (typeof window === "undefined") return;
    void applyAuthPersistence(remember);
    window.location.href = "/api/auth/naver/start";
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        signupWithEmail,
        resumeEmailSignup,
        loginWithGoogle,
        loginWithApple,
        loginWithKakao,
        loginWithNaver,
        logout,
        resendVerificationEmail,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
