export type DmThreadRow = {
  threadId: string;
  otherUid: string;
  otherHandle: string | null;
  otherDisplayName: string;
  otherAvatarUrl: string | null;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  lastSenderUid: string | null;
};

export type DmInboxTab = "primary" | "general" | "requests";
