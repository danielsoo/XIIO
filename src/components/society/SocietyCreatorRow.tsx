"use client";

import Link from "next/link";
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
    <article className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 gap-4">
        <Link
          href={`/people/${person.handle}`}
          className="relative shrink-0"
          aria-label={person.displayName}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full bg-xiio-accent/20 text-lg font-bold text-white ring-2 ring-white/10"
            aria-hidden
          >
            {(person.displayName || "?").slice(0, 1).toUpperCase()}
          </div>
          {person.openToCollaborate ? (
            <span
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0a0b0e] bg-emerald-400"
              aria-hidden
            />
          ) : null}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/people/${person.handle}`}
              className="truncate text-base font-semibold text-white hover:text-xiio-accent transition"
            >
              {person.displayName}
            </Link>
            <span className="text-sm text-white/45">·</span>
            <span className="text-sm text-white/60">{roleLabel}</span>
            <span className="text-sm text-white/45">·</span>
            <span className="truncate text-sm text-white/45">{school}</span>
          </div>
          {quote ? (
            <p className="mt-2 text-sm italic text-white/55 line-clamp-2">&ldquo;{quote}&rdquo;</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end sm:min-w-[140px]">
        <button
          type="button"
          disabled={connectBusy || connected}
          onClick={onConnect}
          className={`rounded-full px-5 py-2 text-sm font-medium transition disabled:opacity-50 ${
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
