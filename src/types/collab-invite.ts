import type { WorkCreditRole } from "@/types/credits";

export const COLLAB_INVITE_STATUSES = [
  "pending",
  "accepted",
  "expired",
  "revoked",
  "cancelled",
] as const;

export type CollabInviteStatus = (typeof COLLAB_INVITE_STATUSES)[number];

export type CollabInviteDoc = {
  id: string;
  ownerUid: string;
  workId: string;
  role: WorkCreditRole;
  characterName?: string;
  invitedEmail: string;
  invitedEmailNormalized: string;
  token: string;
  status: CollabInviteStatus;
  inviterUid: string;
  inviterDisplayName?: string;
  workTitle: string;
  message?: string;
  expiresAt: unknown;
  acceptedByUid?: string;
  acceptedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CollabInvitePublicView = {
  token: string;
  status: CollabInviteStatus;
  role: WorkCreditRole;
  characterName?: string;
  workTitle: string;
  ownerDisplayName: string;
  invitedEmailMasked: string;
  expiresAt: string | null;
  canAccept: boolean;
  acceptBlockReason?: "login_required" | "email_mismatch" | "expired" | "not_pending" | "already_accepted";
  viewerEmail?: string;
};

export type CollabInviteCreateInput = {
  email: string;
  role: WorkCreditRole;
  characterName?: string;
  message?: string;
};
