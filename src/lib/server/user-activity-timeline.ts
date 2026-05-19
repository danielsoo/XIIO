import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { adminTimestampToMillis } from "@/lib/admin/format-timestamp";
import { parseAdminAuditDoc, resolveActorProfiles } from "@/lib/server/admin-audit";
import { parsePaymentEventDoc } from "@/lib/server/payment-events";
import { parseReportDoc } from "@/lib/server/reports";
import { parseUserProfileDoc } from "@/lib/userAccess";
import { parsePromoDoc, parseWorkDoc, promoRef, worksCol } from "@/lib/server/works";
import type {
  AdminUserActivityCategory,
  AdminUserActivityItem,
  AdminUserActivityKind,
} from "@/types/admin";
import { ADMIN_AUDIT_ACTIONS } from "@/types/admin-audit";

const SOURCE_LIMIT = 100;

const PAYMENT_KINDS = new Set<AdminUserActivityKind>(["deposit_payment"]);
const REPORT_KINDS = new Set<AdminUserActivityKind>([
  "report_filed",
  "report_received",
  "report_resolved",
]);
const CONTENT_KINDS = new Set<AdminUserActivityKind>([
  "work_created",
  "work_deletion_requested",
  "work_revision_submitted",
  "work_published",
  "work_reviewed",
  "promo_created",
  "promo_submitted",
  "promo_published",
  "promo_revision_submitted",
  "promo_deletion_requested",
]);
const ENGAGEMENT_KINDS = new Set<AdminUserActivityKind>([
  "promo_like",
  "watch_profile_created",
]);
const ADMIN_KINDS = new Set<AdminUserActivityKind>(["admin_audit"]);

const AUDIT_ACTION_SET = new Set<string>(ADMIN_AUDIT_ACTIONS);

export const ACTIVITY_LIMITATION_KEYS = [
  "admin.userActivity.limitationNoViews",
  "admin.userActivity.limitationNoVisits",
] as const;

function atMillis(at: unknown): number | null {
  if (at instanceof Timestamp) return at.toMillis();
  return adminTimestampToMillis(at);
}

function workAdminHref(ownerUid: string, workId: string): string {
  return `/admin/content/works/${ownerUid}/${workId}`;
}

function watchHref(ownerUid: string, workId: string): string {
  return `/watch/${ownerUid}/${workId}`;
}

function pushEvent(events: AdminUserActivityItem[], item: AdminUserActivityItem): void {
  if (atMillis(item.at) == null) return;
  events.push(item);
}

function matchesCategory(kind: AdminUserActivityKind, category: AdminUserActivityCategory): boolean {
  if (category === "all") return true;
  if (category === "payments") return PAYMENT_KINDS.has(kind);
  if (category === "reports") return REPORT_KINDS.has(kind);
  if (category === "content") return CONTENT_KINDS.has(kind);
  if (category === "engagement") return ENGAGEMENT_KINDS.has(kind);
  if (category === "admin") return ADMIN_KINDS.has(kind);
  return true;
}

async function attachActorProfiles(
  db: Firestore,
  events: AdminUserActivityItem[],
  showActorIdentity: boolean
): Promise<void> {
  if (!showActorIdentity) return;
  const uids: string[] = [];
  for (const e of events) {
    const fromPayload = e.payload?.actorUid;
    if (typeof fromPayload === "string" && fromPayload) uids.push(fromPayload);
  }
  if (uids.length === 0) return;
  const profiles = await resolveActorProfiles(db, uids);
  for (const e of events) {
    const actorUid = e.payload?.actorUid;
    if (typeof actorUid === "string" && actorUid) {
      e.actor = profiles.get(actorUid) ?? { uid: actorUid, displayName: actorUid, email: null };
    }
  }
}

function auditToActivityItem(
  audit: ReturnType<typeof parseAdminAuditDoc> & { id: string },
  perspective: "on_member" | "by_actor"
): AdminUserActivityItem | null {
  if (!AUDIT_ACTION_SET.has(audit.action)) return null;
  const href =
    audit.targetWorkId && audit.targetOwnerUid
      ? workAdminHref(audit.targetOwnerUid, audit.targetWorkId)
      : undefined;

  return {
    id: `audit:${audit.id}`,
    kind: "admin_audit",
    at: audit.createdAt,
    title: "admin_audit",
    payload: {
      action: audit.action,
      actorUid: audit.actorUid,
      targetOwnerUid: audit.targetOwnerUid,
      targetWorkId: audit.targetWorkId ?? "",
      targetType: audit.targetType ?? "",
      workTitle: audit.workTitle ?? "",
      note: audit.note ?? "",
      perspective,
    },
    href,
  };
}

async function collectAdminAuditEvents(
  db: Firestore,
  uid: string
): Promise<AdminUserActivityItem[]> {
  const events: AdminUserActivityItem[] = [];

  const onMemberSnap = await db
    .collection("adminAuditLog")
    .where("targetOwnerUid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(SOURCE_LIMIT)
    .get();

  for (const doc of onMemberSnap.docs) {
    const audit = parseAdminAuditDoc(doc.id, doc.data() as Record<string, unknown>);
    const item = auditToActivityItem(audit, "on_member");
    if (item) pushEvent(events, item);
  }

  const byActorSnap = await db
    .collection("adminAuditLog")
    .where("actorUid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(SOURCE_LIMIT)
    .get();

  for (const doc of byActorSnap.docs) {
    const audit = parseAdminAuditDoc(doc.id, doc.data() as Record<string, unknown>);
    if (audit.targetOwnerUid === uid) continue;
    const item = auditToActivityItem(audit, "by_actor");
    if (item) pushEvent(events, { ...item, id: `audit:actor:${doc.id}` });
  }

  return events;
}

function compareItems(a: AdminUserActivityItem, b: AdminUserActivityItem): number {
  const am = atMillis(a.at) ?? 0;
  const bm = atMillis(b.at) ?? 0;
  if (bm !== am) return bm - am;
  return b.id.localeCompare(a.id);
}

export function encodeActivityCursor(at: unknown, id: string): string | null {
  const ms = atMillis(at);
  if (ms == null) return null;
  return Buffer.from(`${ms},${id}`, "utf8").toString("base64url");
}

export function decodeActivityCursor(
  cursor: string
): { atMillis: number; id: string } | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const idx = raw.lastIndexOf(",");
    if (idx < 0) return null;
    const atMs = Number(raw.slice(0, idx));
    const id = raw.slice(idx + 1);
    if (!Number.isFinite(atMs) || !id) return null;
    return { atMillis: atMs, id };
  } catch {
    return null;
  }
}

function isBeforeCursor(
  item: AdminUserActivityItem,
  cursor: { atMillis: number; id: string }
): boolean {
  const ms = atMillis(item.at) ?? 0;
  if (ms < cursor.atMillis) return true;
  if (ms > cursor.atMillis) return false;
  return item.id < cursor.id;
}

async function collectEvents(
  db: Firestore,
  uid: string,
  showActorIdentity: boolean
): Promise<AdminUserActivityItem[]> {
  const events: AdminUserActivityItem[] = [];

  const userSnap = await db.collection("users").doc(uid).get();
  if (userSnap.exists) {
    const profile = parseUserProfileDoc(userSnap.data() as Record<string, unknown>);
    pushEvent(events, {
      id: `account:joined`,
      kind: "account_joined",
      at: profile.createdAt,
      title: "account_joined",
      payload: { purpose: profile.platformPurpose },
    });
  }

  const paymentsSnap = await db
    .collection("paymentEvents")
    .where("uid", "==", uid)
    .orderBy("processedAt", "desc")
    .limit(SOURCE_LIMIT)
    .get();

  for (const doc of paymentsSnap.docs) {
    const pe = parsePaymentEventDoc(doc.id, doc.data() as Record<string, unknown>);
    pushEvent(events, {
      id: `payment:${doc.id}`,
      kind: "deposit_payment",
      at: pe.processedAt,
      title: "deposit_payment",
      payload: {
        provider: pe.provider,
        amountMinor: pe.amountMinor,
        currency: pe.currency ?? "",
        eventId: doc.id,
      },
    });
  }

  const filedSnap = await db
    .collection("reports")
    .where("reporterUid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(SOURCE_LIMIT)
    .get();

  for (const doc of filedSnap.docs) {
    const r = parseReportDoc(doc.data() as Record<string, unknown>);
    const href = workAdminHref(r.targetOwnerUid, r.targetWorkId);
    pushEvent(events, {
      id: `report:filed:${doc.id}`,
      kind: "report_filed",
      at: r.createdAt,
      title: "report_filed",
      payload: {
        reportId: doc.id,
        targetType: r.targetType,
        targetOwnerUid: r.targetOwnerUid,
        targetWorkId: r.targetWorkId,
        reasonCode: r.reasonCode,
        status: r.status,
      },
      href,
    });
  }

  const receivedSnap = await db
    .collection("reports")
    .where("targetOwnerUid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(SOURCE_LIMIT)
    .get();

  for (const doc of receivedSnap.docs) {
    const r = parseReportDoc(doc.data() as Record<string, unknown>);
    const href = workAdminHref(r.targetOwnerUid, r.targetWorkId);
    pushEvent(events, {
      id: `report:received:${doc.id}`,
      kind: "report_received",
      at: r.createdAt,
      title: "report_received",
      payload: {
        reportId: doc.id,
        targetType: r.targetType,
        targetWorkId: r.targetWorkId,
        reporterUid: r.reporterUid,
        reasonCode: r.reasonCode,
        status: r.status,
      },
      href,
    });
    if (r.resolvedAt && (r.status === "dismissed" || r.status === "action_taken")) {
      pushEvent(events, {
        id: `report:resolved:${doc.id}`,
        kind: "report_resolved",
        at: r.resolvedAt,
        title: "report_resolved",
        payload: {
          reportId: doc.id,
          targetType: r.targetType,
          targetWorkId: r.targetWorkId,
          status: r.status,
          actorUid: r.resolvedByUid ?? "",
        },
        href,
      });
    }
  }

  const worksSnap = await worksCol(db, uid).limit(SOURCE_LIMIT).get();
  for (const workDoc of worksSnap.docs) {
    const w = parseWorkDoc(workDoc.id, workDoc.data() as Record<string, unknown>);
    const href = workAdminHref(uid, w.id);

    pushEvent(events, {
      id: `work:${w.id}:created`,
      kind: "work_created",
      at: w.createdAt,
      title: "work_created",
      payload: { workId: w.id, workTitle: w.title, platformStatus: w.platformStatus },
      href,
    });
    if (w.deletionRequest?.requestedAt) {
      pushEvent(events, {
        id: `work:${w.id}:deletion`,
        kind: "work_deletion_requested",
        at: w.deletionRequest.requestedAt,
        title: "work_deletion_requested",
        payload: { workId: w.id, workTitle: w.title, reason: w.deletionRequest.reason },
        href,
      });
    }
    if (w.pendingRevision?.submittedAt) {
      pushEvent(events, {
        id: `work:${w.id}:revision`,
        kind: "work_revision_submitted",
        at: w.pendingRevision.submittedAt,
        title: "work_revision_submitted",
        payload: { workId: w.id, workTitle: w.title },
        href,
      });
    }
    if (w.publishedAt) {
      pushEvent(events, {
        id: `work:${w.id}:published`,
        kind: "work_published",
        at: w.publishedAt,
        title: "work_published",
        payload: { workId: w.id, workTitle: w.title },
        href,
      });
    }
    if (w.reviewedAt) {
      pushEvent(events, {
        id: `work:${w.id}:reviewed`,
        kind: "work_reviewed",
        at: w.reviewedAt,
        title: "work_reviewed",
        payload: {
          workId: w.id,
          workTitle: w.title,
          platformStatus: w.platformStatus,
          actorUid: w.reviewedBy ?? "",
        },
        href,
      });
    }

    const promoSnap = await promoRef(db, uid, w.id).get();
    if (promoSnap.exists) {
      const p = parsePromoDoc(promoSnap.data() as Record<string, unknown>);
      if (p.createdAt) {
        pushEvent(events, {
          id: `promo:${w.id}:created`,
          kind: "promo_created",
          at: p.createdAt,
          title: "promo_created",
          payload: { workId: w.id, workTitle: w.title, promoTitle: p.title ?? "" },
          href,
        });
      }
      if (p.submittedAt) {
        pushEvent(events, {
          id: `promo:${w.id}:submitted`,
          kind: "promo_submitted",
          at: p.submittedAt,
          title: "promo_submitted",
          payload: { workId: w.id, workTitle: w.title },
          href,
        });
      }
      if (p.publishedAt) {
        pushEvent(events, {
          id: `promo:${w.id}:published`,
          kind: "promo_published",
          at: p.publishedAt,
          title: "promo_published",
          payload: { workId: w.id, workTitle: w.title },
          href,
        });
      }
      if (p.pendingRevision?.submittedAt) {
        pushEvent(events, {
          id: `promo:${w.id}:revision`,
          kind: "promo_revision_submitted",
          at: p.pendingRevision.submittedAt,
          title: "promo_revision_submitted",
          payload: { workId: w.id, workTitle: w.title },
          href,
        });
      }
      if (p.deletionRequest?.requestedAt) {
        pushEvent(events, {
          id: `promo:${w.id}:deletion`,
          kind: "promo_deletion_requested",
          at: p.deletionRequest.requestedAt,
          title: "promo_deletion_requested",
          payload: { workId: w.id, workTitle: w.title, reason: p.deletionRequest.reason },
          href,
        });
      }
    }
  }

  const privateSnap = await db.collection("users").doc(uid).collection("private").get();
  for (const doc of privateSnap.docs) {
    if (!doc.id.startsWith("like_promo_")) continue;
    const data = doc.data();
    const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid : "";
    const workId = typeof data.workId === "string" ? data.workId : "";
    if (!ownerUid || !workId) continue;
    pushEvent(events, {
      id: `like:${doc.id}`,
      kind: "promo_like",
      at: data.createdAt,
      title: "promo_like",
      payload: { ownerUid, workId },
      href: watchHref(ownerUid, workId),
    });
  }

  const profilesSnap = await db
    .collection("users")
    .doc(uid)
    .collection("watchProfiles")
    .limit(SOURCE_LIMIT)
    .get();

  for (const doc of profilesSnap.docs) {
    const data = doc.data();
    const name = typeof data.name === "string" ? data.name : doc.id;
    pushEvent(events, {
      id: `watchProfile:${doc.id}`,
      kind: "watch_profile_created",
      at: data.createdAt,
      title: "watch_profile_created",
      payload: { profileId: doc.id, profileName: name },
    });
  }

  const auditEvents = await collectAdminAuditEvents(db, uid);
  events.push(...auditEvents);

  await attachActorProfiles(db, events, showActorIdentity);

  events.sort(compareItems);
  return events;
}

export async function aggregateUserActivity(
  db: Firestore,
  uid: string,
  opts: {
    category: AdminUserActivityCategory;
    limit: number;
    cursor: string | null;
    showActorIdentity: boolean;
  }
): Promise<{ items: AdminUserActivityItem[]; nextCursor: string | null }> {
  let events = await collectEvents(db, uid, opts.showActorIdentity);
  events = events.filter((e) => matchesCategory(e.kind, opts.category));

  const decoded = opts.cursor ? decodeActivityCursor(opts.cursor) : null;
  if (decoded) {
    events = events.filter((e) => isBeforeCursor(e, decoded));
  }

  const page = events.slice(0, opts.limit);
  let nextCursor: string | null = null;
  if (events.length > opts.limit && page.length > 0) {
    const last = page[page.length - 1]!;
    nextCursor = encodeActivityCursor(last.at, last.id);
  }

  return { items: page, nextCursor };
}
