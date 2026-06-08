"use client";

import Link from "next/link";
import Image from "next/image";
import CreditRolePill from "@/components/profile/CreditRolePill";
import { useTranslations } from "@/context/LocaleContext";
import { gradientForTitle } from "@/lib/works/catalog-ui";

export type ProfileWorkListItem = {
  workId: string;
  ownerUid: string;
  title: string;
  role: string;
  characterName?: string;
  thumbnailUrl?: string | null;
  watchPath: string;
};

type Props = {
  items: ProfileWorkListItem[];
  isSelf?: boolean;
};

export default function ProfileWorksVerticalList({ items, isSelf = false }: Props) {
  const { t } = useTranslations();

  return (
    <section className="min-w-0 flex-1">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{t("society.profileBody.worksTitle")}</h2>
        {isSelf ? (
          <Link
            href="/uploader/works"
            className="text-sm text-xiio-accent transition hover:underline"
          >
            {t("society.profileBody.upload")}
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-white/40">{t("society.profileBody.worksEmpty")}</p>
      ) : (
        <ul className="divide-y divide-white/10">
          {items.map((work) => {
            const gradient = gradientForTitle(work.title);
            return (
              <li key={`${work.ownerUid}_${work.workId}`}>
                <Link
                  href={work.watchPath}
                  className="flex items-center gap-4 py-4 transition hover:bg-white/[0.02]"
                >
                  <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-white/5">
                    {work.thumbnailUrl ? (
                      <Image
                        src={work.thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ background: gradient }}
                        aria-hidden
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-base font-medium text-white">{work.title}</p>
                    <div className="mt-2">
                      <CreditRolePill role={work.role} characterName={work.characterName} />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
