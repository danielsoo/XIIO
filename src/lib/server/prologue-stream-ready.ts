import type { Firestore } from "firebase-admin/firestore";
import { getStreamVideo } from "@/lib/cloudflare/stream";
import {
  validatePrologueVideoDimensions,
  validatePrologueVideoDuration,
} from "@/lib/works/prologue-video";
import { FieldValue, prologueRef } from "@/lib/server/works";

/** 프롤로그 stream ready 시 길이·해상도 검증 후 문서 갱신 */
export async function finalizePrologueStreamIfReady(
  db: Firestore,
  ownerUid: string,
  workId: string,
  streamUid: string,
  target: "prologue" | "prologue_revision"
): Promise<void> {
  const info = await getStreamVideo(streamUid);
  if (!info) return;

  const duration = info.duration ?? 0;
  const width = info.width ?? 0;
  const height = info.height ?? 0;
  const dimErr = validatePrologueVideoDimensions(width, height);
  const durationErr = validatePrologueVideoDuration(duration);

  const ref = prologueRef(db, ownerUid, workId);
  const prefix = target === "prologue_revision" ? "pendingRevision." : "";

  if (dimErr || durationErr) {
    const reason =
      dimErr === "too_small"
        ? "prologue_too_small"
        : dimErr === "invalid_dimensions"
          ? "prologue_invalid_dimensions"
          : durationErr === "too_short"
            ? "prologue_too_short"
            : durationErr === "too_long"
              ? "prologue_too_long"
              : "prologue_invalid";
    await ref.set(
      {
        [`${prefix}streamStatus`]: "error",
        [`${prefix}streamError`]: reason,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  const update: Record<string, unknown> = {
    [`${prefix}streamStatus`]: "ready",
    [`${prefix}streamError`]: FieldValue.delete(),
    [`${prefix}durationSec`]: duration,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (target === "prologue") {
    update.durationSec = duration;
    update.streamError = FieldValue.delete();
  }

  await ref.set(update, { merge: true });
}
