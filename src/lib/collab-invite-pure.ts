import { maskInviteEmail } from "@/lib/collabInviteUrl";
import {
  COLLAB_INVITE_STATUSES,
  type CollabInviteDoc,
  type CollabInvitePublicView,
  type CollabInviteStatus,
} from "@/types/collab-invite";
import { WORK_CREDIT_ROLES, type WorkCreditRole } from "@/types/credits";

function isWorkCreditRole(v: string): v is WorkCreditRole {
  return (WORK_CREDIT_ROLES as readonly string[]).includes(v);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeInviteEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalized)) return null;
  return normalized;
}

export function isCollabInviteStatus(v: string): v is CollabInviteStatus {
  return (COLLAB_INVITE_STATUSES as readonly string[]).includes(v);
}

export function timestampToIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

export function isInviteExpired(expiresAt: unknown): boolean {
  const iso = timestampToIso(expiresAt);
  if (!iso) return false;
  return Date.parse(iso) < Date.now();
}

export function parseCollabInvite(
  id: string,
  data: Record<string, unknown>
): CollabInviteDoc | null {
  const token = String(data.token ?? "");
  const ownerUid = String(data.ownerUid ?? "");
  const workId = String(data.workId ?? "");
  const roleRaw = String(data.role ?? "");
  const invitedEmailNormalized = String(data.invitedEmailNormalized ?? "");
  if (!token || !ownerUid || !workId || !invitedEmailNormalized || !isWorkCreditRole(roleRaw)) {
    return null;
  }
  const statusRaw = String(data.status ?? "pending");
  const status: CollabInviteStatus = isCollabInviteStatus(statusRaw) ? statusRaw : "pending";
  return {
    id,
    ownerUid,
    workId,
    role: roleRaw as WorkCreditRole,
    characterName: data.characterName ? String(data.characterName) : undefined,
    invitedEmail: String(data.invitedEmail ?? invitedEmailNormalized),
    invitedEmailNormalized,
    token,
    status,
    inviterUid: String(data.inviterUid ?? ownerUid),
    inviterDisplayName: data.inviterDisplayName ? String(data.inviterDisplayName) : undefined,
    workTitle: String(data.workTitle ?? ""),
    message: data.message ? String(data.message) : undefined,
    expiresAt: data.expiresAt,
    acceptedByUid: data.acceptedByUid ? String(data.acceptedByUid) : undefined,
    acceptedAt: data.acceptedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export function buildCollabInvitePublicView(
  invite: CollabInviteDoc,
  ownerDisplayName: string,
  options?: { viewerEmail?: string | null; viewerUid?: string | null }
): CollabInvitePublicView {
  const expired = isInviteExpired(invite.expiresAt);
  const effectiveStatus: CollabInviteStatus =
    invite.status === "pending" && expired ? "expired" : invite.status;

  let acceptBlockReason: CollabInvitePublicView["acceptBlockReason"] | undefined;
  let canAccept = false;

  if (effectiveStatus === "accepted") {
    acceptBlockReason = "already_accepted";
  } else if (effectiveStatus !== "pending") {
    acceptBlockReason = "not_pending";
  } else if (!options?.viewerUid) {
    acceptBlockReason = "login_required";
  } else {
    const viewerEmail = options.viewerEmail?.trim().toLowerCase() ?? "";
    if (!viewerEmail || viewerEmail !== invite.invitedEmailNormalized) {
      acceptBlockReason = "email_mismatch";
    } else {
      canAccept = true;
    }
  }

  return {
    token: invite.token,
    status: effectiveStatus,
    role: invite.role,
    characterName: invite.characterName,
    workTitle: invite.workTitle,
    ownerDisplayName,
    invitedEmailMasked: maskInviteEmail(invite.invitedEmail),
    expiresAt: timestampToIso(invite.expiresAt),
    canAccept,
    acceptBlockReason,
    viewerEmail: options?.viewerEmail?.trim().toLowerCase() || undefined,
  };
}
