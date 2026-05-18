"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "@/context/LocaleContext";

export default function AdminUsersLookup() {
  const { t } = useTranslations();
  const router = useRouter();
  const [uid, setUid] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = uid.trim();
    if (!trimmed) return;
    router.push(`/admin/users/${trimmed}`);
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{t("admin.usersTitle")}</h1>
      <p className="text-xiio-muted text-sm mb-6">{t("admin.usersLookupDesc")}</p>

      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-xl">
        <input
          type="text"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder={t("admin.usersLookupPlaceholder")}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent"
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white text-sm font-medium transition"
        >
          {t("admin.usersLookupOpen")}
        </button>
      </form>

      <p className="text-xs text-xiio-muted mt-6">{t("admin.usersLookupHint")}</p>
      <Link href="/admin/content" className="text-sm text-xiio-accent hover:underline mt-4 inline-block">
        {t("admin.userProfile.backToContent")}
      </Link>
    </div>
  );
}
