export type DmThreadDoc = {
  participantIds: [string, string];
  lastMessageAt?: unknown;
  lastMessagePreview?: string;
  lastSenderUid?: string;
  /** uid -> Firestore Timestamp of when that participant last viewed the thread */
  lastReadAt?: Record<string, unknown>;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type DmMessageDoc = {
  senderUid: string;
  text: string;
  createdAt?: unknown;
  /** uid -> emoji, one reaction per user */
  reactions?: Record<string, string>;
  replyToMessageId?: string;
  replyToSenderUid?: string;
  replyToText?: string;
};
