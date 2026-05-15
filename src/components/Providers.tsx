"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ProfileProvider } from "@/context/ProfileContext";
import ProfileGuard from "@/components/ProfileGuard";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ProfileGuard />
        {children}
      </ProfileProvider>
    </AuthProvider>
  );
}
