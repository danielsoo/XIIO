"use client";

import { useTranslations } from "@/context/LocaleContext";
import type { ContentModeration } from "@/types/moderation";

type Props = {
  moderation?: ContentModeration;
  className?: string;
};

export default function ModerationFlagsPanel({ moderation, className = "" }: Props) {
  const { t } = useTranslations();

  if (!moderation || moderation.status === "skipped") return null;

  const statusLabel =
    moderation.status === "pending"
      ? t("admin.moderation.statusPending")
      : moderation.status === "failed"
        ? t("admin.moderation.statusFailed")
        : moderation.status === "completed"
          ? t("admin.moderation.statusCompleted")
          : moderation.status;

  return (
    <div
      className={`rounded-xl border border-violet-500/25 bg-violet-950/30 p-3 text-sm ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-300">
          {t("admin.moderation.aiReview")}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-xiio-muted">
          {statusLabel}
        </span>
        {moderation.hasHighSeverity && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            {t("admin.moderation.highSeverity")}
          </span>
        )}
      </div>

      {moderation.summary && (
        <p className="text-white/90 text-xs leading-relaxed mb-2">{moderation.summary}</p>
      )}

      {moderation.flags.length > 0 ? (
        <ul className="space-y-1">
          {moderation.flags.map((f, i) => (
            <li key={`${f.code}-${i}`} className="text-xs text-white/80 flex flex-wrap gap-x-2">
              <span className="font-medium text-violet-200">
                {t(`admin.moderation.flag.${f.code}`)}
              </span>
              <span className="text-xiio-muted">
                {t(`admin.moderation.severity.${f.severity}`)} · {Math.round(f.confidence * 100)}%
              </span>
              {f.detail && <span className="text-xiio-muted w-full">{f.detail}</span>}
            </li>
          ))}
        </ul>
      ) : moderation.status === "completed" ? (
        <p className="text-xs text-xiio-muted">{t("admin.moderation.noFlags")}</p>
      ) : null}

      {moderation.error && (
        <p className="text-xs text-amber-400/90 mt-2">{moderation.error}</p>
      )}

      {moderation.providers.length > 0 && (
        <p className="text-[10px] text-xiio-muted mt-2">
          {t("admin.moderation.providers")}: {moderation.providers.join(", ")}
        </p>
      )}
    </div>
  );
}
