import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WORK_CREDIT_ROLES, type WorkCreditRole } from "../types/credits.ts";
import {
  COLLAB_INVITE_STATUSES,
  type CollabInviteDoc,
  type CollabInvitePublicView,
  type CollabInviteStatus,
} from "../types/collab-invite.ts";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeInviteEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalized)) return null;
  return normalized;
}

function maskInviteEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "•••";
  const visible = local.length <= 2 ? local[0] ?? "*" : `${local.slice(0, 2)}•••`;
  return `${visible}@${domain}`;
}

function isCollabInviteStatus(v: string): v is CollabInviteStatus {
  return (COLLAB_INVITE_STATUSES as readonly string[]).includes(v);
}

function isWorkCreditRole(v: string): v is WorkCreditRole {
  return (WORK_CREDIT_ROLES as readonly string[]).includes(v);
}

function isInviteExpired(expiresAt: unknown): boolean {
  if (!expiresAt || typeof expiresAt !== "string") return false;
  return Date.parse(expiresAt) < Date.now();
}

function buildCollabInvitePublicView(
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
    expiresAt: typeof invite.expiresAt === "string" ? invite.expiresAt : null,
    canAccept,
    acceptBlockReason,
    viewerEmail: options?.viewerEmail?.trim().toLowerCase() || undefined,
  };
}

function parseCollabInvite(id: string, data: Record<string, unknown>): CollabInviteDoc | null {
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
    role: roleRaw,
    invitedEmail: String(data.invitedEmail ?? invitedEmailNormalized),
    invitedEmailNormalized,
    token,
    status,
    inviterUid: String(data.inviterUid ?? ownerUid),
    workTitle: String(data.workTitle ?? ""),
  };
}

describe("normalizeInviteEmail", () => {
  it("lowercases and trims valid emails", () => {
    assert.equal(normalizeInviteEmail("  User@Example.COM "), "user@example.com");
  });

  it("rejects invalid emails", () => {
    assert.equal(normalizeInviteEmail("not-an-email"), null);
    assert.equal(normalizeInviteEmail(""), null);
  });
});

describe("maskInviteEmail", () => {
  it("masks local part", () => {
    assert.equal(maskInviteEmail("hello@xiio.app"), "he•••@xiio.app");
  });
});

describe("buildCollabInvitePublicView", () => {
  const base: CollabInviteDoc = {
    id: "inv1",
    ownerUid: "owner",
    workId: "work",
    role: "actor",
    invitedEmail: "actor@example.com",
    invitedEmailNormalized: "actor@example.com",
    token: "tok",
    status: "pending",
    inviterUid: "owner",
    workTitle: "Test Work",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  };

  it("requires login for accept", () => {
    const view = buildCollabInvitePublicView(base, "Director", {});
    assert.equal(view.canAccept, false);
    assert.equal(view.acceptBlockReason, "login_required");
  });

  it("requires strict email match", () => {
    const view = buildCollabInvitePublicView(base, "Director", {
      viewerUid: "u1",
      viewerEmail: "other@example.com",
    });
    assert.equal(view.canAccept, false);
    assert.equal(view.acceptBlockReason, "email_mismatch");
  });

  it("allows accept when email matches", () => {
    const view = buildCollabInvitePublicView(base, "Director", {
      viewerUid: "u1",
      viewerEmail: "actor@example.com",
    });
    assert.equal(view.canAccept, true);
    assert.equal(view.acceptBlockReason, undefined);
  });
});

describe("parseCollabInvite", () => {
  it("parses valid documents", () => {
    const invite = parseCollabInvite("id1", {
      token: "abc",
      ownerUid: "o",
      workId: "w",
      role: "writer",
      invitedEmailNormalized: "a@b.co",
      status: "pending",
    });
    assert.ok(invite);
    assert.equal(invite?.role, "writer");
  });
});
