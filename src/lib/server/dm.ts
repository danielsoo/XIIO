import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { DmMessageDoc, DmThreadDoc } from "@/types/dm";
import { isBlocked } from "@/lib/server/blocks";
import { adminTimestampToMillis } from "@/lib/admin/format-timestamp";
import { buildNotificationPayload, notificationsCol } from "@/lib/server/notifications";

const MAX_TEXT = 2000;

export function dmThreadId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

export function dmThreadsCol(db: Firestore) {
  return db.collection("dmThreads");
}

export function dmMessagesCol(db: Firestore, threadId: string) {
  return dmThreadsCol(db).doc(threadId).collection("messages");
}

export function parseDmThread(data: Record<string, unknown>): DmThreadDoc | null {
  const ids = data.participantIds;
  if (!Array.isArray(ids) || ids.length !== 2) return null;
  return {
    participantIds: [String(ids[0]), String(ids[1])] as [string, string],
    lastMessageAt: data.lastMessageAt,
    lastMessagePreview: data.lastMessagePreview
      ? String(data.lastMessagePreview).slice(0, 200)
      : undefined,
    lastSenderUid: data.lastSenderUid ? String(data.lastSenderUid) : undefined,
    lastReadAt:
      data.lastReadAt && typeof data.lastReadAt === "object"
        ? (data.lastReadAt as Record<string, unknown>)
        : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/** 안읽음 여부 — 마지막 메시지 시각이 이 사용자의 마지막 열람 시각보다 나중이면 안읽음 */
export function isThreadUnread(thread: DmThreadDoc, uid: string): boolean {
  const lastMessageMs = adminTimestampToMillis(thread.lastMessageAt);
  if (lastMessageMs == null) return false;
  if (thread.lastSenderUid === uid) return false;
  const readMs = adminTimestampToMillis(thread.lastReadAt?.[uid]);
  return readMs == null || readMs < lastMessageMs;
}

/** 스레드 열람 시 호출 — 해당 사용자에 한해 마지막 열람 시각 갱신 */
export async function markThreadRead(db: Firestore, threadId: string, uid: string): Promise<void> {
  await dmThreadsCol(db)
    .doc(threadId)
    .update({ [`lastReadAt.${uid}`]: FieldValue.serverTimestamp() });
}

export function parseDmMessage(id: string, data: Record<string, unknown>): DmMessageDoc & { id: string } {
  return {
    id,
    senderUid: String(data.senderUid ?? ""),
    text: String(data.text ?? "").slice(0, MAX_TEXT),
    createdAt: data.createdAt,
  };
}

export async function getOrCreateThread(
  db: Firestore,
  uidA: string,
  uidB: string
): Promise<{ threadId: string } | { error: string }> {
  if (uidA === uidB) return { error: "self_dm" };
  if (await isBlocked(db, uidA, uidB)) return { error: "blocked" };

  const threadId = dmThreadId(uidA, uidB);
  const ref = dmThreadsCol(db).doc(threadId);
  const snap = await ref.get();
  if (!snap.exists) {
    const participants: [string, string] = [uidA, uidB].sort() as [string, string];
    await ref.set({
      participantIds: participants,
      lastMessageAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  return { threadId };
}

export async function sendDmMessage(
  db: Firestore,
  threadId: string,
  senderUid: string,
  text: string,
  /**
   * Client already knows the other participant from its last thread load — passing it lets us
   * run the isBlocked check in parallel with the thread read instead of after it (shaves one
   * network round-trip off every send). The hint is only trusted once verified against the
   * thread's real participantIds below; otherwise we fall back to the safe sequential check.
   */
  otherUidHint?: string
): Promise<{ ok: true; messageId: string } | { ok: false; code: string }> {
  const trimmed = text.trim().slice(0, MAX_TEXT);
  if (!trimmed) return { ok: false, code: "empty" };

  const threadRef = dmThreadsCol(db).doc(threadId);
  const [threadSnap, hintBlocked] = await Promise.all([
    threadRef.get(),
    otherUidHint ? isBlocked(db, senderUid, otherUidHint) : Promise.resolve(null),
  ]);
  if (!threadSnap.exists) return { ok: false, code: "thread_not_found" };
  const thread = parseDmThread(threadSnap.data() as Record<string, unknown>);
  if (!thread) return { ok: false, code: "thread_invalid" };
  if (!thread.participantIds.includes(senderUid)) return { ok: false, code: "forbidden" };

  const otherUid = thread.participantIds.find((id) => id !== senderUid);
  if (!otherUid) return { ok: false, code: "blocked" };

  const blocked =
    hintBlocked !== null && otherUidHint === otherUid ? hintBlocked : await isBlocked(db, senderUid, otherUid);
  if (blocked) return { ok: false, code: "blocked" };

  const msgRef = dmMessagesCol(db, threadId).doc();
  const batch = db.batch();
  batch.set(msgRef, {
    senderUid,
    text: trimmed,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.update(threadRef, {
    lastMessageAt: FieldValue.serverTimestamp(),
    lastMessagePreview: trimmed.slice(0, 120),
    lastSenderUid: senderUid,
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(
    notificationsCol(db).doc(),
    buildNotificationPayload({
      recipientUid: otherUid,
      type: "new_dm_message",
      actorUid: senderUid,
      threadId,
      messagePreview: trimmed.slice(0, 120),
    })
  );
  await batch.commit();
  return { ok: true, messageId: msgRef.id };
}

export async function listThreadsForUser(db: Firestore, uid: string, limit = 40) {
  const snap = await dmThreadsCol(db)
    .where("participantIds", "array-contains", uid)
    .orderBy("lastMessageAt", "desc")
    .limit(limit)
    .get();
  return snap.docs
    .map((d) => {
      const thread = parseDmThread(d.data() as Record<string, unknown>);
      if (!thread) return null;
      const otherUid = thread.participantIds.find((id) => id !== uid) ?? "";
      return { threadId: d.id, otherUid, thread };
    })
    .filter(Boolean);
}

export async function countUnreadThreadsForUser(db: Firestore, uid: string): Promise<number> {
  const rows = await listThreadsForUser(db, uid);
  return rows.filter((row) => row && isThreadUnread(row.thread, uid)).length;
}
