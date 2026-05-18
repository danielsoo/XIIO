"use client";

import { useTranslations } from "@/context/LocaleContext";
import type { RejectReasonCode } from "@/types/work";

type Props = {
  rejectReasonCode: RejectReasonCode | "";
  rejectReason: string;
  onCodeChange: (code: RejectReasonCode | "") => void;
  onReasonChange: (reason: string) => void;
  /** full review uses coded reasons; promo may use text only */
  showCodeSelect?: boolean;
};

export function canSubmitReject(
  code: RejectReasonCode | "",
  reason: string,
  requireCode: boolean
): boolean {
  if (requireCode) {
    return code !== "" && (code !== "other" || reason.trim().length > 0);
  }
  return reason.trim().length > 0;
}

export default function RejectReasonFields({
  rejectReasonCode,
  rejectReason,
  onCodeChange,
  onReasonChange,
  showCodeSelect = true,
}: Props) {
  const { t } = useTranslations();

  return (
    <div className="mt-3 p-3 rounded-xl border border-red-500/30 bg-red-500/5 space-y-2">
      {showCodeSelect && (
        <>
          <label className="block text-xs text-xiio-muted">{t("admin.contentReview.rejectReasonCode")}</label>
          <select
            value={rejectReasonCode}
            onChange={(e) => onCodeChange(e.target.value as RejectReasonCode | "")}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">{t("admin.contentReview.selectRejectReason")}</option>
            <option value="category_mismatch">{t("admin.contentReview.rejectCategoryMismatch")}</option>
            <option value="tag_mismatch">{t("admin.contentReview.rejectTagMismatch")}</option>
            <option value="other">{t("admin.contentReview.rejectOther")}</option>
          </select>
        </>
      )}
      <label className="block text-xs text-xiio-muted">
        {showCodeSelect ? t("admin.contentReview.rejectPlaceholder") : t("admin.contentReview.rejectReasonPromo")}
      </label>
      <input
        type="text"
        value={rejectReason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder={t("admin.contentReview.rejectPlaceholder")}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
      />
    </div>
  );
}
