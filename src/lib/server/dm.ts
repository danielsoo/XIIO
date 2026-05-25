import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { DmMessageDoc, DmThreadDoc } from "@/types/dm";
import { isBlocked } from "@/lib/server/blocks";

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
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
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
  text: string
): Promise<{ ok: true; messageId: string } | { ok: false; code: string }> {
  const trimmed = text.trim().slice(0, MAX_TEXT);
  if (!trimmed) return { ok: false, code: "empty" };

  const threadRef = dmThreadsCol(db).doc(threadId);
  const threadSnap = await threadRef.get();
  if (!threadSnap.exists) return { ok: false, code: "thread_not_found" };
  const thread = parseDmThread(threadSnap.data() as Record<string, unknown>);
  if (!thread) return { ok: false, code: "thread_invalid" };
  if (!thread.participantIds.includes(senderUid)) return { ok: false, code: "forbidden" };

  const otherUid = thread.participantIds.find((id) => id !== senderUid);
  if (!otherUid || (await isBlocked(db, senderUid, otherUid))) {
    return { ok: false, code: "blocked" };
  }

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
    updatedAt: FieldValue.serverTimestamp(),
  });
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
