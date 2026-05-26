"use client";

import Link from "next/link";
import type { ReactNode, MouseEvent } from "react";
import { peopleProfileHref } from "@/lib/dm/peopleProfileHref";
import { useTranslations } from "@/context/LocaleContext";

type Props = {
  handle: string | null | undefined;
  children: ReactNode;
  className?: string;
  stopPropagation?: boolean;
};

export default function DmProfileLink({
  handle,
  children,
  className = "",
  stopPropagation = false,
}: Props) {
  const { t } = useTranslations();
  const href = peopleProfileHref(handle);

  if (!href) {
    return <span className={className}>{children}</span>;
  }

  const onClick = stopPropagation
    ? (e: MouseEvent) => {
        e.stopPropagation();
      }
    : undefined;

  return (
    <Link
      href={href}
      className={`${className} hover:opacity-90 transition`.trim()}
      aria-label={t("dm.viewProfile")}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
