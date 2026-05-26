"use client";

import { useTranslations } from "@/context/LocaleContext";

type Props = {
  role: string;
  characterName?: string;
  className?: string;
};

export default function CreditRolePill({ role, characterName, className = "" }: Props) {
  const { t } = useTranslations();
  const label = t(`network.credits.role.${role}`);
  const text = characterName ? `${label} · ${characterName}` : label;

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border border-xiio-accent/35 bg-xiio-accent/15 px-3 py-1 text-xs text-white truncate ${className}`}
      title={text}
    >
      {text}
    </span>
  );
}
