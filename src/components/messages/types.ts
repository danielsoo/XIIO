export type DmThreadRow = {
  threadId: string;
  otherUid: string;
  otherHandle: string | null;
  otherDisplayName: string;
  otherAvatarUrl: string | null;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  lastSenderUid: string | null;
  unread: boolean;
};

export type RoomMemberPreview = {
  uid: string;
  displayName: string;
  avatarUrl: string | null;
};

export type RoomListItem = {
  roomId: string;
  name: string;
  memberIds: string[];
  memberPreview: RoomMemberPreview[];
  lastMessagePreview: string;
  lastMessageAt: string | null;
  lastSenderUid: string | null;
  unread: boolean;
};

export type DmMainTab = "messages" | "groups" | "requests" | "invites";
