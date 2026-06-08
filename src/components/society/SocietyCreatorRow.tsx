"use client";

import Link from "next/link";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { useTranslations } from "@/context/LocaleContext";
import {
  mockActiveAgoForUid,
  mockSchoolForUid,
  mockTagsForPerson,
  primaryRoleLabelKey,
} from "@/lib/societyMockData";
import type { SocietyPerson } from "@/lib/societyTypes";

type Props = {
  person: SocietyPerson;
  connected: boolean;
  connectBusy: boolean;
  onConnect: () => void;
};

export default function SocietyCreatorRow({
  person,
  connected,
  connectBusy,
  onConnect,
}: Props) {
  const { t } = useTranslations();
  const school = mockSchoolForUid(person.uid);
  const tags = mockTagsForPerson(person.uid, person.roleTags, person.headline);
  const roleKey = primaryRoleLabelKey(person.roleTags);
  const roleLabel = roleKey ? t(roleKey) : t("society.roleCrew");
  const quote =
    person.headline?.trim() ||
    person.collaborationNote?.trim() ||
    person.bio?.trim()?.slice(0, 120) ||
    "";
  const activeTime = mockActiveAgoForUid(person.uid);

  return (
    <article className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:gap-6 lg:gap-8">
      <div className="flex items-center gap-4 sm:contents">
        <Link
          href={`/people/${person.handle}`}
          className="relative shrink-0"
          aria-label={person.displayName}
        >
          <ProfileAvatar
            displayName={person.displayName}
            avatarUrl={person.avatarUrl}
            className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-xiio-accent/20 text-xl font-bold text-white ring-2 ring-white/10 sm:h-20 sm:w-20 sm:text-2xl"
            imgClassName="h-full w-full object-cover"
          />
        </Link>

        <div className="min-w-0 w-full shrink-0 sm:w-[160px] lg:w-[180px]">
          <div className="flex items-center gap-2">
            <Link
              href={`/people/${person.handle}`}
              className="truncate text-base font-semibold text-white transition hover:text-xiio-accent"
            >
              {person.displayName}
            </Link>
            {person.isOnline ? (
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-emerald-400"
                aria-label={t("society.online")}
              />
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-white/50">{roleLabel}</p>
          <p className="mt-0.5 truncate text-sm text-white/50">{school}</p>
        </div>
      </div>

      <div className="min-w-0 flex-1 sm:ml-10 sm:max-w-md md:ml-14 lg:ml-20 lg:max-w-lg">
        {quote ? (
          <p className="text-sm leading-relaxed text-white/55 line-clamp-2">{quote}</p>
        ) : null}
        <div className={`flex flex-wrap gap-2 ${quote ? "mt-3" : ""}`}>
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:min-w-[120px] sm:items-end">
        <button
          type="button"
          disabled={connectBusy || connected}
          onClick={onConnect}
          className={`rounded-lg px-5 py-2 text-sm font-medium transition disabled:opacity-50 ${
            connected
              ? "border border-white/20 bg-white/5 text-white/60"
              : "border border-xiio-accent text-xiio-accent hover:bg-xiio-accent/10"
          }`}
        >
          {connectBusy
            ? t("society.connecting")
            : connected
              ? t("society.connected")
              : t("society.connect")}
        </button>
        <p className="text-center text-xs text-white/35 sm:text-right">
          {t("society.activeAgo", { time: activeTime })}
        </p>
      </div>
    </article>
  );
}
