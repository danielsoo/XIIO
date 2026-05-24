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
};

export default function UploadWizardStepper({
  steps,
  currentIndex,
  onStepClick,
  disabled = false,
}: Props) {
  const { t } = useTranslations();

  return (
    <nav
      className="rounded-2xl border border-white/10 bg-xiio-surface p-5"
      aria-label={t("uploader.uploadWizardStepsLabel")}
    >
      <p className="text-xs font-medium text-xiio-muted uppercase tracking-wide mb-4">
        {t("uploader.uploadWizardStepsLabel")}
      </p>
      <ol className="space-y-0">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;
          const canClick = !disabled && isComplete && onStepClick != null;

          return (
            <li key={step.id} className="relative flex gap-3">
              {index < steps.length - 1 && (
                <span
                  className={`absolute left-[15px] top-8 bottom-0 w-px ${
                    isComplete ? "bg-xiio-accent/50" : "bg-white/10"
                  }`}
                  aria-hidden
                />
              )}
              {canClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  className="flex gap-3 w-full text-left rounded-lg py-2 -mx-1 px-1 hover:bg-white/5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-xiio-accent"
                >
                  <StepIndicator
                    index={index}
                    isComplete={isComplete}
                    isCurrent={isCurrent}
                    isUpcoming={isUpcoming}
                  />
                  <StepText
                    title={t(step.titleKey)}
                    hint={t(step.hintKey)}
                    isComplete={isComplete}
                    isCurrent={isCurrent}
                    isUpcoming={isUpcoming}
                  />
                </button>
              ) : (
                <div className="flex gap-3 w-full py-2">
                  <StepIndicator
                    index={index}
                    isComplete={isComplete}
                    isCurrent={isCurrent}
                    isUpcoming={isUpcoming}
                  />
                  <StepText
                    title={t(step.titleKey)}
                    hint={t(step.hintKey)}
                    isComplete={isComplete}
                    isCurrent={isCurrent}
                    isUpcoming={isUpcoming}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepIndicator({
  index,
  isComplete,
  isCurrent,
  isUpcoming,
}: {
  index: number;
  isComplete: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
}) {
  return (
    <span
      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold border transition-colors ${
        isCurrent
          ? "border-xiio-accent bg-xiio-accent text-white"
          : isComplete
            ? "border-xiio-accent/60 bg-xiio-accent/20 text-xiio-accent"
            : isUpcoming
              ? "border-white/15 bg-white/5 text-xiio-muted"
              : "border-white/15 bg-white/5 text-xiio-muted"
      }`}
      aria-hidden
    >
      {isComplete ? (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        index + 1
      )}
    </span>
  );
}

function StepText({
  title,
  hint,
  isComplete,
  isCurrent,
  isUpcoming,
}: {
  title: string;
  hint: string;
  isComplete: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
}) {
  return (
    <span className="min-w-0 pt-0.5 pb-1">
      <span
        className={`block text-sm font-medium leading-snug ${
          isCurrent ? "text-white" : isComplete ? "text-white/80" : "text-xiio-muted"
        }`}
      >
        {title}
      </span>
      <span
        className={`block text-xs mt-0.5 leading-relaxed ${
          isCurrent ? "text-xiio-muted" : isUpcoming ? "text-xiio-muted/70" : "text-xiio-muted/80"
        }`}
      >
        {hint}
      </span>
    </span>
  );
}
