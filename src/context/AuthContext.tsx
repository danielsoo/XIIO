"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  deleteUser,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { applyAuthPersistence } from "@/lib/authPersistence";
import { hasUserProfile, saveUserProfile } from "@/lib/userProfile";
import type { SignupProfile } from "@/types/user";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string, remember?: boolean) => Promise<void>;
  signupWithEmail: (email: string, password: string, profile: SignupProfile) => Promise<void>;
  /** Auth만 있고 Firestore 프로필이 없을 때 같은 비밀번호로 이어서 가입 */
  resumeEmailSignup: (
    email: string,
    password: string,
    profile: SignupProfile
  ) => Promise<{ needsVerification: boolean }>;
  loginWithGoogle: (remember?: boolean) => Promise<User>;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<boolean>;
}

export const EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED";
/** 프로필은 저장됐으나 인증 메일 전송만 실패 (Auth 계정 유지) */
export const SIGNUP_VERIFY_EMAIL_FAILED = "SIGNUP_VERIFY_EMAIL_FAILED";

const AuthContext = createContext<AuthContextType | null>(null);

async function rollbackAuthUser(user: User | null) {
  if (!user) return;
  try {
    await deleteUser(user);
  } catch {
    // 이미 삭제됐거나 권한 없음 — 무시
  }
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
      const err = new Error(EMAIL_NOT_VERIFIED);
      throw err;
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
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      newUser = user;
      await updateProfile(newUser, { displayName: profile.displayName });
      await saveUserProfile(newUser.uid, profile, newUser.email);
      profileSaved = true;

      try {
        await sendEmailVerification(newUser);
      } catch {
        const err = new Error(SIGNUP_VERIFY_EMAIL_FAILED);
        throw err;
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
    const { user: googleUser } = await signInWithPopup(auth, googleProvider);
    return googleUser;
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
