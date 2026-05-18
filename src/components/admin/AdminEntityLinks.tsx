"use client";

import Link from "next/link";
import { useTranslations } from "@/context/LocaleContext";

type Props = {
  ownerUid: string;
  workId: string;
  ownerLabel?: string;
  className?: string;
};

export function AdminOwnerLink({
  ownerUid,
  ownerLabel,
  className = "",
}: Pick<Props, "ownerUid" | "ownerLabel" | "className">) {
  const { t } = useTranslations();
  return (
    <Link
      href={`/admin/users/${ownerUid}`}
      className={`text-xiio-accent hover:underline ${className}`}
    >
      {ownerLabel ?? t("admin.contentReview.viewProfile")}
    </Link>
  );
}

export function AdminWorkLink({
  ownerUid,
  workId,
  className = "",
}: Pick<Props, "ownerUid" | "workId" | "className">) {
  const { t } = useTranslations();
  return (
    <Link
      href={`/admin/content/works/${ownerUid}/${workId}`}
      className={`text-xiio-accent hover:underline ${className}`}
    >
      {t("admin.contentReview.viewWork")}
    </Link>
  );
}

export function AdminEntityLinks({ ownerUid, workId, ownerLabel, className = "" }: Props) {
  return (
    <div className={`flex flex-wrap gap-3 text-xs ${className}`}>
      <AdminWorkLink ownerUid={ownerUid} workId={workId} />
      <AdminOwnerLink ownerUid={ownerUid} ownerLabel={ownerLabel} />
    </div>
  );
}
