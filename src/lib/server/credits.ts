import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  WORK_CREDIT_ROLES,
  WORK_CREDIT_STATUSES,
  type CreditIndexDoc,
  type WorkCredit,
  type WorkCreditInput,
  type WorkCreditRole,
  type WorkCreditStatus,
} from "@/types/credits";
import type { WorkDoc } from "@/types/work";
import { parseWorkDoc, worksCol } from "@/lib/server/works";

const HANDLE_REGEX = /^[a-z0-9_]{3,30}$/;
const CREDIT_CHARACTER_NAME_MAX = 120;

/** creditIndex·CreditRolePill 호환 — 표시명 스냅샷 */
export function creditCharacterNameSnapshot(displayName: string): string | null {
  const trimmed = displayName.trim().slice(0, CREDIT_CHARACTER_NAME_MAX);
  return trimmed || null;
}

export function resolveCreditDisplayNameFromMap(
  displayNames: Map<string, string>,
  userId: string,
  role: string
): string {
  return (
    displayNames.get(`${userId}:${role}`) ?? displayNames.get(userId) ?? ""
  ).slice(0, CREDIT_CHARACTER_NAME_MAX);
}

/** Firestore 문서용 — undefined 금지, 빈 값은 null */
export function normalizeCreditCharacterNameForFirestore(
  characterName?: string
): string | null {
  const trimmed = characterName?.trim().slice(0, CREDIT_CHARACTER_NAME_MAX);
  return trimmed ? trimmed : null;
}

/** API/메모리용 — 빈 값은 undefined (필드 생략) */
export function normalizeCreditCharacterName(characterName?: string): string | undefined {
  const trimmed = characterName?.trim().slice(0, CREDIT_CHARACTER_NAME_MAX);
  return trimmed || undefined;
}

export function normalizeWorkCreditInput(input: WorkCreditInput): WorkCreditInput {
  const base: WorkCreditInput = {
    userId: input.userId,
    role: input.role,
    sortOrder: input.sortOrder,
  };
  const characterName = normalizeCreditCharacterName(input.characterName);
  return characterName ? { ...base, characterName } : base;
}

export function normalizeHandle(raw: string): string | null {
  const h = raw.trim().toLowerCase().replace(/^@/, "");
  if (!HANDLE_REGEX.test(h)) return null;
  return h;
}

export function isWorkCreditRole(v: string): v is WorkCreditRole {
  return (WORK_CREDIT_ROLES as readonly string[]).includes(v);
}

export function isWorkCreditStatus(v: string): v is WorkCreditStatus {
  return (WORK_CREDIT_STATUSES as readonly string[]).includes(v);
}

export function creditsCol(db: Firestore, ownerUid: string, workId: string) {
  return worksCol(db, ownerUid).doc(workId).collection("credits");
}

export function creditIndexCol(db: Firestore, userId: string) {
  return db.collection("users").doc(userId).collection("creditIndex");
}

export function parseWorkCredit(id: string, data: Record<string, unknown>): WorkCredit | null {
  const userId = String(data.userId ?? "");
  const role = String(data.role ?? "");
  if (!userId || !isWorkCreditRole(role)) return null;
  const statusRaw = String(data.status ?? "accepted");
  const status: WorkCreditStatus = isWorkCreditStatus(statusRaw) ? statusRaw : "accepted";
  return {
    id,
    userId,
    role,
    displayName: data.displayName ? String(data.displayName) : undefined,
    characterName: data.characterName ? String(data.characterName) : undefined,
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
    status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function listWorkCredits(
  db: Firestore,
  ownerUid: string,
  workId: string
): Promise<WorkCredit[]> {
  const snap = await creditsCol(db, ownerUid, workId).orderBy("sortOrder", "asc").get();
  return snap.docs
    .map((d) => parseWorkCredit(d.id, d.data() as Record<string, unknown>))
    .filter((c): c is WorkCredit => c != null);
}

export function validateCreditInputs(
  inputs: WorkCreditInput[],
  ownerUid: string
): { ok: true; credits: WorkCreditInput[] } | { ok: false; message: string } {
  const seen = new Set<string>();
  for (const c of inputs) {
    if (!c.userId?.trim()) return { ok: false, message: "credit_user_required" };
    if (c.userId === ownerUid && c.role !== "director") {
      /* owner can be tagged as director via credit */
    }
    if (!isWorkCreditRole(c.role)) return { ok: false, message: "credit_role_invalid" };
    const key = `${c.userId}:${c.role}`;
    if (seen.has(key)) return { ok: false, message: "credit_duplicate" };
    seen.add(key);
  }
  return { ok: true, credits: inputs.map(normalizeWorkCreditInput) };
}

export async function writeWorkCredits(
  db: Firestore,
  ownerUid: string,
  workId: string,
  work: Pick<WorkDoc, "title" | "section" | "platformStatus" | "streamUid">,
  inputs: WorkCreditInput[],
  displayNames: Map<string, string>
): Promise<WorkCredit[]> {
  const col = creditsCol(db, ownerUid, workId);
  const existingSnap = await col.get();
  const existingParsed = existingSnap.docs
    .map((d) => parseWorkCredit(d.id, d.data() as Record<string, unknown>))
    .filter((c): c is WorkCredit => c != null);
  const indexUserIds = [
    ...new Set([...existingParsed.map((c) => c.userId), ...inputs.map((c) => c.userId)]),
  ];
  await clearCreditIndexForWork(db, ownerUid, workId, indexUserIds);

  const batch = db.batch();
  for (const doc of existingSnap.docs) {
    batch.delete(doc.ref);
  }

  const written: WorkCredit[] = [];
  let order = 0;
  for (const input of inputs) {
    const ref = col.doc();
    const displayName = resolveCreditDisplayNameFromMap(
      displayNames,
      input.userId,
      input.role
    );
    const data = {
      userId: input.userId,
      role: input.role,
      displayName: displayName || null,
      characterName: creditCharacterNameSnapshot(displayName),
      sortOrder: input.sortOrder ?? order++,
      status: "accepted",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    batch.set(ref, data);
    written.push({
      id: ref.id,
      userId: input.userId,
      role: input.role,
      displayName: displayName || undefined,
      characterName: creditCharacterNameSnapshot(displayName) ?? undefined,
      sortOrder: data.sortOrder as number,
      status: "accepted",
    });
  }
  await batch.commit();
  await syncCreditIndexForWork(db, ownerUid, workId, work, written);
  return written;
}

async function clearCreditIndexForWork(
  db: Firestore,
  ownerUid: string,
  workId: string,
  userIds: string[]
): Promise<void> {
  const batch = db.batch();
  let count = 0;
  for (const userId of userIds) {
    const snap = await creditIndexCol(db, userId)
      .where("ownerUid", "==", ownerUid)
      .where("workId", "==", workId)
      .get();
    for (const d of snap.docs) {
      batch.delete(d.ref);
      count++;
      if (count >= 400) {
        await batch.commit();
        count = 0;
      }
    }
  }
  if (count > 0) await batch.commit();
}

export async function syncCreditIndexForWork(
  db: Firestore,
  ownerUid: string,
  workId: string,
  work: Pick<WorkDoc, "title" | "section" | "platformStatus" | "streamUid">,
  credits: WorkCredit[]
): Promise<void> {
  const userIds = [...new Set(credits.map((c) => c.userId))];
  await clearCreditIndexForWork(db, ownerUid, workId, userIds);

  const batch = db.batch();
  for (const c of credits) {
    if (c.status !== "accepted") continue;
    const ref = creditIndexCol(db, c.userId).doc(`${ownerUid}_${workId}_${c.id}`);
    const doc: CreditIndexDoc = {
      ownerUid,
      workId,
      role: c.role,
      characterName: normalizeCreditCharacterNameForFirestore(c.characterName),
      workTitle: work.title,
      workSection: work.section,
      platformStatus: work.platformStatus,
      ...(work.streamUid ? { streamUid: work.streamUid } : {}),
      creditedAt: FieldValue.serverTimestamp(),
    };
    batch.set(ref, doc);
  }
  await batch.commit();
}

/** 단일 크레딧 추가 — 동일 userId+role이 있으면 idempotent하게 기존 반환 */
export async function appendAcceptedWorkCredit(
  db: Firestore,
  ownerUid: string,
  workId: string,
  input: WorkCreditInput,
  displayName: string
): Promise<{ credit: WorkCredit; created: boolean }> {
  const workSnap = await worksCol(db, ownerUid).doc(workId).get();
  if (!workSnap.exists) throw new Error("work_not_found");
  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);

  const existing = await listWorkCredits(db, ownerUid, workId);
  const duplicate = existing.find((c) => c.userId === input.userId && c.role === input.role);
  if (duplicate) {
    return { credit: duplicate, created: false };
  }

  const col = creditsCol(db, ownerUid, workId);
  const ref = col.doc();
  const sortOrder = input.sortOrder ?? existing.length;
  const trimmedDisplay = displayName.trim().slice(0, 120);
  const data = {
    userId: input.userId,
    role: input.role,
    displayName: trimmedDisplay || null,
    characterName: creditCharacterNameSnapshot(trimmedDisplay),
    sortOrder,
    status: "accepted",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await ref.set(data);
  const credit: WorkCredit = {
    id: ref.id,
    userId: input.userId,
    role: input.role,
    displayName: trimmedDisplay || undefined,
    characterName: creditCharacterNameSnapshot(trimmedDisplay) ?? undefined,
    sortOrder,
    status: "accepted",
  };
  const allAccepted = [...existing.filter((c) => c.status === "accepted"), credit];
  await syncCreditIndexForWork(db, ownerUid, workId, work, allAccepted);
  return { credit, created: true };
}

export async function refreshCreditIndexForWorkStatus(
  db: Firestore,
  ownerUid: string,
  workId: string
): Promise<void> {
  const workSnap = await worksCol(db, ownerUid).doc(workId).get();
  if (!workSnap.exists) return;
  const work = parseWorkDoc(workId, workSnap.data() as Record<string, unknown>);
  const credits = await listWorkCredits(db, ownerUid, workId);
  await syncCreditIndexForWork(db, ownerUid, workId, work, credits);
}

export async function ensureOwnerDirectorCredit(
  db: Firestore,
  ownerUid: string,
  workId: string,
  work: Pick<WorkDoc, "title" | "section" | "platformStatus" | "streamUid" | "director">,
  displayName: string
): Promise<void> {
  const existing = await listWorkCredits(db, ownerUid, workId);
  const hasDirector = existing.some((c) => c.userId === ownerUid && c.role === "director");
  if (hasDirector) return;
  const inputs: WorkCreditInput[] = [
    { userId: ownerUid, role: "director", sortOrder: 0 },
    ...existing
      .filter((c) => !(c.userId === ownerUid && c.role === "director"))
      .map((c, i) =>
        normalizeWorkCreditInput({
          userId: c.userId,
          role: c.role,
          characterName: c.characterName,
          sortOrder: i + 1,
        })
      ),
  ];
  const names = new Map<string, string>([
    [`${ownerUid}:director`, displayName || work.director || ""],
  ]);
  for (const c of existing) {
    if (c.displayName) {
      names.set(`${c.userId}:${c.role}`, c.displayName);
    }
  }
  await writeWorkCredits(db, ownerUid, workId, work, inputs, names);
}
