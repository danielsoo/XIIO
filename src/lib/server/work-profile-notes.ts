import { FieldValue, type Firestore } from "firebase-admin/firestore";

const MAX_NOTE_LENGTH = 2000;

export function workProfileNoteDocId(ownerUid: string, workId: string): string {
  return `${ownerUid}_${workId}`;
}

export function workProfileNotesCol(db: Firestore, profileUid: string) {
  return db.collection("users").doc(profileUid).collection("workProfileNotes");
}

export async function listWorkProfileNotes(
  db: Firestore,
  profileUid: string
): Promise<Record<string, string>> {
  const snap = await workProfileNotesCol(db, profileUid).get();
  const out: Record<string, string> = {};
  for (const doc of snap.docs) {
    const data = doc.data();
    const text = typeof data.text === "string" ? data.text.trim() : "";
    if (text) out[doc.id] = text;
  }
  return out;
}

export async function upsertWorkProfileNote(
  db: Firestore,
  profileUid: string,
  ownerUid: string,
  workId: string,
  text: string
): Promise<void> {
  const trimmed = text.trim().slice(0, MAX_NOTE_LENGTH);
  const ref = workProfileNotesCol(db, profileUid).doc(workProfileNoteDocId(ownerUid, workId));

  if (!trimmed) {
    const snap = await ref.get();
    if (snap.exists) await ref.delete();
    return;
  }

  await ref.set(
    {
      ownerUid,
      workId,
      text: trimmed,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
