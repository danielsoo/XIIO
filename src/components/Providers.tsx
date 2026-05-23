"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { LocaleProvider } from "@/context/LocaleContext";
import { ProfileProvider } from "@/context/ProfileContext";
import ProfileGuard from "@/components/ProfileGuard";
import MemberGuard from "@/components/MemberGuard";
import VisitRecorder from "@/components/VisitRecorder";
import ProfileLocaleSync from "@/components/ProfileLocaleSync";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <ProfileProvider>
          <ProfileLocaleSync />
          <VisitRecorder />
          <MemberGuard />
          <ProfileGuard />
          {children}
        </ProfileProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
