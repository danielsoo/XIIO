import { randomBytes } from "crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  buildCollabInvitePublicView,
  isInviteExpired,
  normalizeInviteEmail,
  parseCollabInvite,
} from "@/lib/collab-invite-pure";
import {
  appendAcceptedWorkCredit,
  isWorkCreditRole,
} from "@/lib/server/credits";
import { parseWorkDoc, worksCol } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";
import type { CollabInviteCreateInput, CollabInviteDoc } from "@/types/collab-invite";

export {
  buildCollabInvitePublicView,
  normalizeInviteEmail,
  parseCollabInvite,
} from "@/lib/collab-invite-pure";

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function collabInvitesCol(db: Firestore) {
  return db.collection("collabInvites");
}

export function generateCollabInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function findCollabInviteByToken(
  db: Firestore,
  token: string
): Promise<CollabInviteDoc | null> {
  const snap = await collabInvitesCol(db).where("token", "==", token).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return parseCollabInvite(doc.id, doc.data() as Record<string, unknown>);
}

export async function listCollabInvitesForWork(
  db: Firestore,
  ownerUid: string,
  workId: string
): Promise<CollabInviteDoc[]> {
  const snap = await collabInvitesCol(db)
    .where("ownerUid", "==", ownerUid)
    .where("workId", "==", workId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs
    .map((d) => parseCollabInvite(d.id, d.data() as Record<string, unknown>))
    .filter((i): i is CollabInviteDoc => i != null);
}

export async function listPendingCollabInvitesForEmail(
  db: Firestore,
  emailNormalized: string
): Promise<CollabInviteDoc[]> {
  const snap = await collabInvitesCol(db)
    .where("invitedEmailNormalized", "==", emailNormalized)
    .where("status", "==", "pending")
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs
    .map((d) => parseCollabInvite(d.id, d.data() as Record<string, unknown>))
    .filter((i): i is CollabInviteDoc => i != null && !isInviteExpired(i.expiresAt));
}

export async function createCollabInvite(
  db: Firestore,
  params: {
    ownerUid: string;
    workId: string;
    inviterUid: string;
    inviterDisplayName: string;
    input: CollabInviteCreateInput;
  }
): Promise<
  | { ok: true; invite: CollabInviteDoc }
  | { ok: false; error: string }
> {
  const emailNormalized = normalizeInviteEmail(params.input.email);
  if (!emailNormalized) return { ok: false, error: "invite_email_invalid" };
  if (!isWorkCreditRole(params.input.role)) return { ok: false, error: "invite_role_invalid" };
  if (params.input.role === "director") return { ok: false, error: "invite_role_invalid" };

  const workSnap = await worksCol(db, params.ownerUid).doc(params.workId).get();
  if (!workSnap.exists) return { ok: false, error: "work_not_found" };
  const work = parseWorkDoc(params.workId, workSnap.data() as Record<string, unknown>);

  const inviterSnap = await db.collection("users").doc(params.inviterUid).get();
  const inviterEmail = inviterSnap.exists
    ? parseUserProfileDoc(inviterSnap.data() as Record<string, unknown>).email?.trim().toLowerCase()
    : undefined;
  if (inviterEmail && inviterEmail === emailNormalized) {
    return { ok: false, error: "invite_self" };
  }

  const existingPending = await collabInvitesCol(db)
    .where("ownerUid", "==", params.ownerUid)
    .where("workId", "==", params.workId)
    .where("invitedEmailNormalized", "==", emailNormalized)
    .where("status", "==", "pending")
    .limit(1)
    .get();
  if (!existingPending.empty) {
    const dup = parseCollabInvite(
      existingPending.docs[0].id,
      existingPending.docs[0].data() as Record<string, unknown>
    );
    if (dup && dup.role === params.input.role) {
      return { ok: false, error: "invite_duplicate_pending" };
    }
  }

  const token = generateCollabInviteToken();
  const ref = collabInvitesCol(db).doc();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  const characterName = params.input.characterName?.trim().slice(0, 120) || null;
  const message = params.input.message?.trim().slice(0, 500) || null;

  const data = {
    ownerUid: params.ownerUid,
    workId: params.workId,
    role: params.input.role,
    characterName,
    invitedEmail: params.input.email.trim(),
    invitedEmailNormalized: emailNormalized,
    token,
    status: "pending" as const,
    inviterUid: params.inviterUid,
    inviterDisplayName: params.inviterDisplayName.slice(0, 120),
    workTitle: work.title.slice(0, 200),
    message,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(data);
  const invite = parseCollabInvite(ref.id, { ...data, expiresAt });
  if (!invite) return { ok: false, error: "invite_create_failed" };
  return { ok: true, invite };
}

export async function acceptCollabInvite(
  db: Firestore,
  token: string,
  accepterUid: string,
  accepterEmail: string
): Promise<
  | { ok: true; workId: string; ownerUid: string; alreadyAccepted: boolean }
  | { ok: false; error: string }
> {
  const emailNormalized = normalizeInviteEmail(accepterEmail);
  if (!emailNormalized) return { ok: false, error: "invite_email_required" };

  const inviteRef = collabInvitesCol(db);
  const snap = await inviteRef.where("token", "==", token).limit(1).get();
  if (snap.empty) return { ok: false, error: "invite_not_found" };

  const doc = snap.docs[0];
  const invite = parseCollabInvite(doc.id, doc.data() as Record<string, unknown>);
  if (!invite) return { ok: false, error: "invite_not_found" };

  if (invite.status === "accepted" && invite.acceptedByUid === accepterUid) {
    return {
      ok: true,
      workId: invite.workId,
      ownerUid: invite.ownerUid,
      alreadyAccepted: true,
    };
  }

  if (invite.status !== "pending") return { ok: false, error: "invite_not_pending" };
  if (isInviteExpired(invite.expiresAt)) {
    await doc.ref.update({ status: "expired", updatedAt: FieldValue.serverTimestamp() });
    return { ok: false, error: "invite_expired" };
  }
  if (emailNormalized !== invite.invitedEmailNormalized) {
    return { ok: false, error: "invite_email_mismatch" };
  }
  if (accepterUid === invite.ownerUid) {
    return { ok: false, error: "invite_owner_cannot_accept" };
  }

  const accepterSnap = await db.collection("users").doc(accepterUid).get();
  if (!accepterSnap.exists) return { ok: false, error: "user_not_found" };
  const accepterProfile = parseUserProfileDoc(accepterSnap.data() as Record<string, unknown>);
  const displayName = accepterProfile.displayName || accepterProfile.handle || "";

  const workSnap = await worksCol(db, invite.ownerUid).doc(invite.workId).get();
  if (!workSnap.exists) return { ok: false, error: "work_not_found" };

  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(doc.ref);
    if (!fresh.exists) throw new Error("invite_not_found");
    const current = parseCollabInvite(fresh.id, fresh.data() as Record<string, unknown>);
    if (!current) throw new Error("invite_not_found");
    if (current.status === "accepted") {
      if (current.acceptedByUid !== accepterUid) throw new Error("invite_already_accepted");
      return;
    }
    if (current.status !== "pending") throw new Error("invite_not_pending");
    if (isInviteExpired(current.expiresAt)) throw new Error("invite_expired");
    tx.update(doc.ref, {
      status: "accepted",
      acceptedByUid: accepterUid,
      acceptedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await appendAcceptedWorkCredit(db, invite.ownerUid, invite.workId, {
    userId: accepterUid,
    role: invite.role,
    characterName: invite.characterName,
  }, displayName);

  return {
    ok: true,
    workId: invite.workId,
    ownerUid: invite.ownerUid,
    alreadyAccepted: false,
  };
}
