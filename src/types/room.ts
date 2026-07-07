export const MAX_ROOM_MEMBERS = 50;

export type RoomDoc = {
  name: string;
  memberIds: string[];
  createdBy: string;
  lastMessageAt?: unknown;
  lastMessagePreview?: string;
  lastSenderUid?: string;
  /** uid -> Firestore Timestamp of when that member last viewed the room */
  lastReadAt?: Record<string, unknown>;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type RoomMessageDoc = {
  senderUid: string;
  text: string;
  createdAt?: unknown;
};
