"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DmInboxProvider } from "@/components/messages/DmInboxContext";
import DmInboxLayout from "@/components/messages/DmInboxLayout";
import AppPageShell from "@/components/layout/AppPageShell";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";

export default function MessagesLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { t } = useTranslations();

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-xiio-bg">
        <Link href="/login" className="text-xiio-accent hover:underline">
          {t("common.loginRequired")}
        </Link>
      </main>
    );
  }

  return (
    <AppPageShell className="pb-6">
      <DmInboxProvider>
        <DmInboxLayout>{children}</DmInboxLayout>
      </DmInboxProvider>
    </AppPageShell>
  );
}
