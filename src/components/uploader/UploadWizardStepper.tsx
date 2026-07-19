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
};

export default function UploadWizardStepper({
  steps,
  currentIndex,
  onStepClick,
  disabled = false,
  stepsLabelKey = "uploader.uploadWizardStepsLabel",
}: Props) {
  const { t } = useTranslations();
  const stepsLabel = t(stepsLabelKey);

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
