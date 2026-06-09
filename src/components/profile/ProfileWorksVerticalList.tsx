"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import CreditRolePill from "@/components/profile/CreditRolePill";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { profileInputClass } from "@/lib/profileFormStyles";
import { gradientForTitle } from "@/lib/works/catalog-ui";

export type ProfileWorkListItem = {
  workId: string;
  ownerUid: string;
  title: string;
  role: string;
  characterName?: string;
  thumbnailUrl?: string | null;
  watchPath: string;
  profileNote?: string | null;
};

type Props = {
  items: ProfileWorkListItem[];
  isSelf?: boolean;
};

function WorkListThumbnail({
  thumbnailUrl,
  gradient,
  title,
}: {
  thumbnailUrl?: string | null;
  gradient: string;
  title: string;
}) {
  const [thumbFailed, setThumbFailed] = useState(false);

  useEffect(() => {
    setThumbFailed(false);
  }, [thumbnailUrl]);

  const showThumbnail = Boolean(thumbnailUrl) && !thumbFailed;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
      {showThumbnail ? (
        <Image
          src={thumbnailUrl!}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 420px"
          unoptimized
          onError={() => setThumbFailed(true)}
        />
      ) : (
        <div className="h-full w-full" style={{ background: gradient }} aria-hidden />
      )}
      <span className="sr-only">{title}</span>
    </div>
  );
}

function WorkProfileNoteEditor({
  work,
  initialNote,
}: {
  work: ProfileWorkListItem;
  initialNote: string | null | undefined;
}) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [draft, setDraft] = useState(initialNote ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setDraft(initialNote ?? "");
  }, [initialNote, work.ownerUid, work.workId]);

  const handleSave = async () => {
    if (!user) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/me/work-profile-notes", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerUid: work.ownerUid,
          workId: work.workId,
          text: draft,
        }),
      });
      if (!res.ok) {
        setErr(t("society.workNote.saveError"));
        return;
      }
      setMsg(t("society.workNote.saved"));
    } catch {
      setErr(t("society.workNote.saveError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <label className="block text-xs text-xiio-muted">{t("society.workNote.label")}</label>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={5}
        placeholder={t("society.workNote.placeholder")}
        className={profileInputClass}
      />
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
      <button
        type="button"
        disabled={busy || !user}
        onClick={() => void handleSave()}
        className="px-4 py-2 rounded-lg bg-xiio-accent text-white text-sm font-medium disabled:opacity-40"
      >
        {t("society.workNote.save")}
      </button>
    </div>
  );
}

export default function ProfileWorksVerticalList({ items, isSelf = false }: Props) {
  const { t } = useTranslations();

  return (
    <section className="min-w-0 w-full">
      <div className="mb-6 flex items-center justify-between gap-3">
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
            const note = work.profileNote?.trim() || null;

            return (
              <li key={`${work.ownerUid}_${work.workId}`} className="py-8 first:pt-0">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                  <Link
                    href={work.watchPath}
                    className="block w-full shrink-0 sm:max-w-[min(420px,45%)]"
                  >
                    <WorkListThumbnail
                      thumbnailUrl={work.thumbnailUrl}
                      gradient={gradient}
                      title={work.title}
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={work.watchPath}
                      className="text-lg font-semibold text-white transition hover:text-xiio-accent"
                    >
                      {work.title}
                    </Link>
                    <div className="mt-2">
                      <CreditRolePill role={work.role} characterName={work.characterName} />
                    </div>

                    {isSelf ? (
                      <WorkProfileNoteEditor work={work} initialNote={note} />
                    ) : note ? (
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/55">
                        {note}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
