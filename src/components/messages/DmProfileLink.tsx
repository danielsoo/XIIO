"use client";

import Link from "next/link";
import type { ReactNode, MouseEvent } from "react";
import { peopleProfileHref } from "@/lib/dm/peopleProfileHref";
import { useTranslations } from "@/context/LocaleContext";

type Props = {
  handle: string | null | undefined;
  uid?: string | null | undefined;
  children: ReactNode;
  className?: string;
  stopPropagation?: boolean;
};

export default function DmProfileLink({
  handle,
  uid,
  children,
  className = "",
  stopPropagation = false,
}: Props) {
  const { t } = useTranslations();
  const href = peopleProfileHref(handle, uid);

  if (!href) {
    return <span className={className}>{children}</span>;
  }

  const onClick = (e: MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
  };

  return (
    <Link
      href={href}
      className={`relative z-10 ${className} hover:opacity-90 transition cursor-pointer`.trim()}
      aria-label={t("dm.viewProfile")}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
