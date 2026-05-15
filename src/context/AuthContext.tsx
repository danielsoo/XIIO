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
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { saveUserProfile } from "@/lib/userProfile";
import type { SignupProfile } from "@/types/user";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, profile: SignupProfile) => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<boolean>;
}

export const EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED";

const AuthContext = createContext<AuthContextType | null>(null);

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

  const loginWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    await signInWithEmailAndPassword(auth, email, password);
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.emailVerified) {
      await sendEmailVerification(currentUser);
      await signOut(auth);
      const err = new Error(EMAIL_NOT_VERIFIED);
      throw err;
    }
  };

  const signupWithEmail = async (email: string, password: string, profile: SignupProfile) => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName: profile.displayName });
    await sendEmailVerification(newUser);
    try {
      await Promise.race([
        saveUserProfile(newUser.uid, profile, newUser.email),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("profile-save-timeout")), 8000);
        }),
      ]);
    } catch {
      // Firestore 미설정·규칙 오류여도 가입·인증 메일 흐름은 계속
      console.warn("프로필 저장에 실패했습니다. Firestore 설정을 확인해주세요.");
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

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Firebase가 설정되지 않았습니다.");
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
