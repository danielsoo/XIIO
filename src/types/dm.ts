export type DmThreadDoc = {
  participantIds: [string, string];
  lastMessageAt?: unknown;
  lastMessagePreview?: string;
  lastSenderUid?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type DmMessageDoc = {
  senderUid: string;
  text: string;
  createdAt?: unknown;
};
