import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { parseUserProfileDoc } from "@/lib/userAccess";
import type { AdminActivityActor, AdminWorkAuditItem } from "@/types/admin";
import type { AdminAuditAction, AdminAuditDoc, AdminAuditTargetType } from "@/types/admin-audit";

export type RecordAdminAuditInput = {
  actorUid: string;
  action: AdminAuditAction;
  targetOwnerUid: string;
  targetWorkId?: string;
  targetType?: AdminAuditTargetType;
  targetReportId?: string;
  workTitle?: string;
  note?: string;
};

export async function recordAdminAudit(
  db: Firestore,
  input: RecordAdminAuditInput
): Promise<string> {
  const ref = await db.collection("adminAuditLog").add({
    actorUid: input.actorUid,
    action: input.action,
    targetOwnerUid: input.targetOwnerUid,
    targetWorkId: input.targetWorkId ?? null,
    targetType: input.targetType ?? null,
    targetReportId: input.targetReportId ?? null,
    workTitle: input.workTitle ?? null,
    note: input.note ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export function parseAdminAuditDoc(
  id: string,
  data: Record<string, unknown>
): AdminAuditDoc & { id: string } {
  const action = String(data.action ?? "");
  return {
    id,
    actorUid: String(data.actorUid ?? ""),
    action: action as AdminAuditAction,
    targetOwnerUid: String(data.targetOwnerUid ?? ""),
    targetWorkId: data.targetWorkId ? String(data.targetWorkId) : undefined,
    targetType: data.targetType ? (String(data.targetType) as AdminAuditTargetType) : undefined,
    targetReportId: data.targetReportId ? String(data.targetReportId) : undefined,
    workTitle: data.workTitle ? String(data.workTitle) : undefined,
    note: data.note ? String(data.note) : undefined,
    createdAt: data.createdAt,
  };
}

export async function resolveActorProfiles(
  db: Firestore,
  uids: string[]
): Promise<Map<string, AdminActivityActor>> {
  const unique = [...new Set(uids.filter(Boolean))];
  const map = new Map<string, AdminActivityActor>();
  await Promise.all(
    unique.map(async (uid) => {
      const snap = await db.collection("users").doc(uid).get();
      if (!snap.exists) {
        map.set(uid, { uid, displayName: uid, email: null });
        return;
      }
      const profile = parseUserProfileDoc(snap.data() as Record<string, unknown>);
      map.set(uid, {
        uid,
        displayName: profile.displayName || uid,
        email: profile.email,
      });
    })
  );
  return map;
}

export async function listWorkAuditLog(
  db: Firestore,
  ownerUid: string,
  workId: string,
  showActorIdentity: boolean,
  limit = 30
): Promise<AdminWorkAuditItem[]> {
  const snap = await db
    .collection("adminAuditLog")
    .where("targetOwnerUid", "==", ownerUid)
    .where("targetWorkId", "==", workId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  const docs = snap.docs.map((d) =>
    parseAdminAuditDoc(d.id, d.data() as Record<string, unknown>)
  );

  let actors = new Map<string, AdminActivityActor>();
  if (showActorIdentity) {
    actors = await resolveActorProfiles(
      db,
      docs.map((d) => d.actorUid)
    );
  }

  return docs.map((d) => ({
    id: d.id,
    action: d.action,
    at: d.createdAt,
    workTitle: d.workTitle,
    note: d.note,
    actor: showActorIdentity ? (actors.get(d.actorUid) ?? { uid: d.actorUid, displayName: d.actorUid, email: null }) : null,
  }));
}
