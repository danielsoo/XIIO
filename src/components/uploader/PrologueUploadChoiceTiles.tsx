"use client";

import { useTranslations } from "@/context/LocaleContext";

export type PrologueUploadChoice = "upload" | "skip";

type Props = {
  value: PrologueUploadChoice | null;
  onChange: (choice: PrologueUploadChoice) => void;
  disabled?: boolean;
};

export default function PrologueUploadChoiceTiles({ value, onChange, disabled }: Props) {
  const { t } = useTranslations();

  const tileClass = (selected: boolean) =>
    `flex min-h-[88px] flex-col items-center justify-center rounded-xl border-2 px-4 py-5 text-center transition disabled:opacity-40 ${
      selected
        ? "border-xiio-accent bg-xiio-accent/10 text-white"
        : "border-white/15 bg-white/5 text-xiio-muted hover:border-white/25 hover:text-white"
    }`;

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        disabled={disabled}
        className={tileClass(value === "upload")}
        onClick={() => onChange("upload")}
      >
        <span className="text-sm font-semibold">{t("uploader.prologueChoiceUpload")}</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        className={tileClass(value === "skip")}
        onClick={() => onChange("skip")}
      >
        <span className="text-sm font-semibold">{t("uploader.prologueChoiceSkip")}</span>
      </button>
    </div>
  );
}
