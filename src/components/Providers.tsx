"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { LocaleProvider } from "@/context/LocaleContext";
import { ProfileProvider } from "@/context/ProfileContext";
import ProfileGuard from "@/components/ProfileGuard";
import MemberGuard from "@/components/MemberGuard";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <ProfileProvider>
          <MemberGuard />
          <ProfileGuard />
          {children}
        </ProfileProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
