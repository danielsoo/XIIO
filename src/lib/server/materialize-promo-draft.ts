import type { Firestore } from "firebase-admin/firestore";

/** @deprecated Promo shorts are uploaded as separate portrait files; clip materialization removed. */
export async function materializePromoFromDraft(
  _db: Firestore,
  _ownerUid: string,
  _workId: string
): Promise<"created" | "skipped" | "failed"> {
  return "skipped";
}
