import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { NOTIFICATION_TYPES, type NotificationDoc, type NotificationType } from "@/types/notification";

const MAX_MARK_READ_BATCH = 500;

export function notificationsCol(db: Firestore) {
  return db.collection("notifications");
}

export function isValidNotificationType(v: string): v is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(v);
}

export function parseNotificationDoc(id: string, data: Record<string, unknown>): NotificationDoc & { id: string } {
  return {
    id,
    recipientUid: String(data.recipientUid ?? ""),
    type: isValidNotificationType(String(data.type)) ? (data.type as NotificationType) : "new_follower",
    actorUid: data.actorUid ? String(data.actorUid) : undefined,
    read: data.read === true,
    createdAt: data.createdAt,
    workId: data.workId ? String(data.workId) : undefined,
    workTitle: data.workTitle ? String(data.workTitle) : undefined,
    rejectReasonCode: data.rejectReasonCode ? String(data.rejectReasonCode) : undefined,
    threadId: data.threadId ? String(data.threadId) : undefined,
    roomId: data.roomId ? String(data.roomId) : undefined,
    roomName: data.roomName ? String(data.roomName) : undefined,
    inviteId: data.inviteId ? String(data.inviteId) : undefined,
    messagePreview: data.messagePreview ? String(data.messagePreview) : undefined,
  };
}

export type BuildNotificationInput = {
  recipientUid: string;
  type: NotificationType;
  actorUid?: string;
  workId?: string;
  workTitle?: string;
  rejectReasonCode?: string;
  threadId?: string;
  roomId?: string;
  roomName?: string;
  inviteId?: string;
  messagePreview?: string;
};

/** 배치에 바로 넣을 원시 알림 문서 — DB 접근 없는 순수 함수 */
export function buildNotificationPayload(input: BuildNotificationInput): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    recipientUid: input.recipientUid,
    type: input.type,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  };
  if (input.actorUid) doc.actorUid = input.actorUid;
  if (input.workId) doc.workId = input.workId;
  if (input.workTitle) doc.workTitle = input.workTitle;
  if (input.rejectReasonCode) doc.rejectReasonCode = input.rejectReasonCode;
  if (input.threadId) doc.threadId = input.threadId;
  if (input.roomId) doc.roomId = input.roomId;
  if (input.roomName) doc.roomName = input.roomName;
  if (input.inviteId) doc.inviteId = input.inviteId;
  if (input.messagePreview) doc.messagePreview = input.messagePreview;
  return doc;
}

/** 단발성 쓰기 지점(작품 승인/반려, 구직 제안 생성/수락/거절)에서 사용하는 얇은 래퍼 */
export async function createNotification(db: Firestore, input: BuildNotificationInput): Promise<void> {
  await notificationsCol(db).add(buildNotificationPayload(input));
}

export async function listNotificationsForUser(
  db: Firestore,
  uid: string,
  limit = 20
): Promise<(NotificationDoc & { id: string })[]> {
  const snap = await notificationsCol(db)
    .where("recipientUid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => parseNotificationDoc(d.id, d.data() as Record<string, unknown>));
}

export async function countUnreadNotificationsForUser(db: Firestore, uid: string): Promise<number> {
  const snap = await notificationsCol(db)
    .where("recipientUid", "==", uid)
    .where("read", "==", false)
    .count()
    .get();
  return snap.data().count;
}

export async function markAllNotificationsRead(db: Firestore, uid: string): Promise<void> {
  const snap = await notificationsCol(db)
    .where("recipientUid", "==", uid)
    .where("read", "==", false)
    .limit(MAX_MARK_READ_BATCH)
    .get();
  if (snap.empty) return;
  const batch = db.batch();
  for (const doc of snap.docs) {
    batch.update(doc.ref, { read: true });
  }
  await batch.commit();
}
