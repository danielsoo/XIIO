"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ProfileProvider } from "@/context/ProfileContext";
import ProfileGuard from "@/components/ProfileGuard";
import MemberGuard from "@/components/MemberGuard";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <MemberGuard />
        <ProfileGuard />
        {children}
      </ProfileProvider>
    </AuthProvider>
  );
}
