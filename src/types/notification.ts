export const NOTIFICATION_TYPES = [
  "work_approve",
  "work_reject",
  "new_follower",
  "new_dm_message",
  "new_room_message",
  "business_invite_received",
  "business_invite_accepted",
  "business_invite_declined",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationDoc = {
  recipientUid: string;
  type: NotificationType;
  actorUid?: string;
  read: boolean;
  createdAt?: unknown;

  workId?: string;
  workTitle?: string;
  rejectReasonCode?: string;
  threadId?: string;
  roomId?: string;
  roomName?: string;
  inviteId?: string;
  messagePreview?: string;
};

export type NotificationListItem = NotificationDoc & {
  id: string;
  createdAt: string | null;
  targetPath: string;
  actorDisplayName?: string;
  actorAvatarUrl?: string | null;
};
