"use client";

import { useTranslations } from "@/context/LocaleContext";

export type UploadWizardStepMeta = {
  id: string;
  titleKey: string;
  hintKey: string;
};

type Props = {
  steps: UploadWizardStepMeta[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
  disabled?: boolean;
  /** i18n key for nav label; defaults to uploader.uploadWizardStepsLabel */
  stepsLabelKey?: string;
  orientation?: "horizontal" | "vertical";
};

export default function UploadWizardStepper({
  steps,
  currentIndex,
  onStepClick,
  disabled = false,
  stepsLabelKey = "uploader.uploadWizardStepsLabel",
  orientation = "horizontal",
}: Props) {
  const { t } = useTranslations();
  const stepsLabel = t(stepsLabelKey);

  if (orientation === "vertical") {
    return (
      <nav
        className="rounded-2xl border border-white/[0.09] bg-[#101013] px-5 py-6 xl:px-6"
        aria-label={stepsLabel}
      >
        <p className="mb-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">
          {stepsLabel}
        </p>
        <ol>
          {steps.map((step, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;
            const canClick = !disabled && isComplete && onStepClick != null;
            const content = (
              <>
                <span className="relative flex w-12 shrink-0 justify-center">
                  {index < steps.length - 1 ? (
                    <span
                      className={`absolute left-1/2 top-11 h-[calc(100%+1.25rem)] w-px -translate-x-1/2 ${
                        isComplete ? "bg-xiio-accent/55" : "bg-white/10"
                      }`}
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border text-[13px] font-semibold transition ${
                      isCurrent
                        ? "border-xiio-accent bg-xiio-accent text-white shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                        : isComplete
                          ? "border-xiio-accent/70 bg-xiio-accent/10 text-xiio-accent"
                          : "border-white/15 bg-white/[0.025] text-white/35"
                    }`}
                    aria-hidden
                  >
                    {isComplete ? (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </span>
                </span>
                <span className="min-w-0 pt-1.5 text-left">
                  <span
                    className={`block text-[14px] font-semibold leading-snug transition ${
                      isCurrent
                        ? "text-white"
                        : isComplete
                          ? "text-white/75"
                          : "text-white/35"
                    }`}
                  >
                    {t(step.titleKey)}
                  </span>
                  <span
                    className={`mt-1 block text-[12px] leading-relaxed ${
                      isCurrent ? "text-white/55" : "text-white/30"
                    }`}
                  >
                    {t(step.hintKey)}
                  </span>
                </span>
              </>
            );

            return (
              <li key={step.id} className="relative min-h-[108px] last:min-h-0">
                {canClick ? (
                  <button
                    type="button"
                    onClick={() => onStepClick(index)}
                    className="grid w-full grid-cols-[3rem_minmax(0,1fr)] gap-3 rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-xiio-accent"
                  >
                    {content}
                  </button>
                ) : (
                  <div
                    className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3"
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav
      className="border-b border-white/[0.08]"
      aria-label={stepsLabel}
    >
      <p className="sr-only">{stepsLabel}</p>
      <ol className="flex min-w-max items-end gap-7 overflow-x-auto px-1 lg:gap-10">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const canClick = !disabled && isComplete && onStepClick != null;
          const tabClass = `relative inline-flex min-h-11 items-center pb-3 pt-1 text-[13px] font-medium transition after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:content-[''] ${
            isCurrent
              ? "text-white after:bg-xiio-accent"
              : isComplete
                ? "text-white/65 after:bg-transparent hover:text-white"
                : "text-white/30 after:bg-transparent"
          }`;

          return (
            <li key={step.id} className="shrink-0">
              {canClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  className={`${tabClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-xiio-accent`}
                  title={t(step.hintKey)}
                >
                  {t(step.titleKey)}
                </button>
              ) : (
                <span
                  className={tabClass}
                  aria-current={isCurrent ? "step" : undefined}
                  title={t(step.hintKey)}
                >
                  {t(step.titleKey)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
