const DB_NAME = "xiio-upload-drafts";
const DB_VERSION = 1;
const FILE_STORE = "files";
const STATE_PREFIX = "xiio:upload-draft:v1:";
const DRAFT_STATE_PREFIX = "xiio:upload-draft:v2:";
const DRAFT_INDEX_PREFIX = "xiio:upload-drafts:v2:";

export type UploadDraftFileKind = "full" | "thumbnail" | "prologue" | "promo";

export type StoredUploadDraft<T> = {
  version: 1;
  savedAt: number;
  state: T;
};

export type UploadDraftSummary = {
  id: string;
  savedAt: number;
  title: string;
  section: string;
  stepIndex: number;
  fileName?: string;
};

export type StoredNamedUploadDraft<T> = {
  version: 2;
  id: string;
  savedAt: number;
  state: T;
};

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("draft_db_open_failed"));
  });
}

function fileKey(uid: string, kind: UploadDraftFileKind) {
  return `${uid}:${kind}`;
}

function namedFileKey(uid: string, draftId: string, kind: UploadDraftFileKind) {
  return `${uid}:${draftId}:${kind}`;
}

function namedStateKey(uid: string, draftId: string) {
  return `${DRAFT_STATE_PREFIX}${uid}:${draftId}`;
}

function readDraftIndex(uid: string): UploadDraftSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(`${DRAFT_INDEX_PREFIX}${uid}`) ?? "[]");
    return Array.isArray(parsed) ? (parsed as UploadDraftSummary[]) : [];
  } catch {
    return [];
  }
}

function writeDraftIndex(uid: string, summaries: UploadDraftSummary[]) {
  window.localStorage.setItem(`${DRAFT_INDEX_PREFIX}${uid}`, JSON.stringify(summaries));
}

export function listUploadDraftSummaries(uid: string): UploadDraftSummary[] {
  const named = readDraftIndex(uid).sort((a, b) => b.savedAt - a.savedAt);
  const legacy = readUploadDraftState<Record<string, unknown>>(uid);
  if (!legacy) return named;
  return [
    ...named,
    {
      id: "legacy",
      savedAt: legacy.savedAt,
      title: typeof legacy.state.title === "string" ? legacy.state.title : "",
      section: typeof legacy.state.section === "string" ? legacy.state.section : "movies",
      stepIndex: typeof legacy.state.stepIndex === "number" ? legacy.state.stepIndex : 0,
    },
  ].sort((a, b) => b.savedAt - a.savedAt);
}

export function readNamedUploadDraftState<T>(
  uid: string,
  draftId: string
): StoredNamedUploadDraft<T> | null {
  if (draftId === "legacy") {
    const legacy = readUploadDraftState<T>(uid);
    return legacy
      ? { version: 2, id: "legacy", savedAt: legacy.savedAt, state: legacy.state }
      : null;
  }
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(namedStateKey(uid, draftId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredNamedUploadDraft<T>;
    return parsed.version === 2 && parsed.state ? parsed : null;
  } catch {
    return null;
  }
}

export function writeNamedUploadDraftState<T>(
  uid: string,
  draftId: string,
  state: T,
  summary: Omit<UploadDraftSummary, "id" | "savedAt">,
  savedAt = Date.now()
) {
  if (draftId === "legacy") {
    writeUploadDraftState(uid, state, savedAt);
    return savedAt;
  }
  window.localStorage.setItem(
    namedStateKey(uid, draftId),
    JSON.stringify({ version: 2, id: draftId, savedAt, state } satisfies StoredNamedUploadDraft<T>)
  );
  const next = readDraftIndex(uid).filter((item) => item.id !== draftId);
  next.unshift({ id: draftId, savedAt, ...summary });
  writeDraftIndex(uid, next);
  return savedAt;
}

export function clearNamedUploadDraftState(uid: string, draftId: string) {
  if (draftId === "legacy") {
    clearUploadDraftState(uid);
    return;
  }
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(namedStateKey(uid, draftId));
  writeDraftIndex(
    uid,
    readDraftIndex(uid).filter((item) => item.id !== draftId)
  );
}

export function readUploadDraftState<T>(uid: string): StoredUploadDraft<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${STATE_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUploadDraft<T>;
    if (parsed.version !== 1 || !parsed.state) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeUploadDraftState<T>(uid: string, state: T, savedAt = Date.now()) {
  window.localStorage.setItem(
    `${STATE_PREFIX}${uid}`,
    JSON.stringify({ version: 1, savedAt, state } satisfies StoredUploadDraft<T>)
  );
  return savedAt;
}

export function clearUploadDraftState(uid: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`${STATE_PREFIX}${uid}`);
}

export async function readUploadDraftFile(uid: string, kind: UploadDraftFileKind) {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDraftDb();
  try {
    return await new Promise<File | null>((resolve, reject) => {
      const request = db.transaction(FILE_STORE, "readonly").objectStore(FILE_STORE).get(fileKey(uid, kind));
      request.onsuccess = () => resolve(request.result instanceof File ? request.result : null);
      request.onerror = () => reject(request.error ?? new Error("draft_file_read_failed"));
    });
  } finally {
    db.close();
  }
}

export async function writeUploadDraftFile(
  uid: string,
  kind: UploadDraftFileKind,
  file: File | null
) {
  if (typeof indexedDB === "undefined") return;
  const db = await openDraftDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const store = db.transaction(FILE_STORE, "readwrite").objectStore(FILE_STORE);
      const request = file
        ? store.put(file, fileKey(uid, kind))
        : store.delete(fileKey(uid, kind));
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("draft_file_write_failed"));
    });
  } finally {
    db.close();
  }
}

export async function readNamedUploadDraftFile(
  uid: string,
  draftId: string,
  kind: UploadDraftFileKind
) {
  if (draftId === "legacy") return readUploadDraftFile(uid, kind);
  if (typeof indexedDB === "undefined") return null;
  const db = await openDraftDb();
  try {
    return await new Promise<File | null>((resolve, reject) => {
      const request = db
        .transaction(FILE_STORE, "readonly")
        .objectStore(FILE_STORE)
        .get(namedFileKey(uid, draftId, kind));
      request.onsuccess = () => resolve(request.result instanceof File ? request.result : null);
      request.onerror = () => reject(request.error ?? new Error("draft_file_read_failed"));
    });
  } finally {
    db.close();
  }
}

export async function writeNamedUploadDraftFile(
  uid: string,
  draftId: string,
  kind: UploadDraftFileKind,
  file: File | null
) {
  if (draftId === "legacy") return writeUploadDraftFile(uid, kind, file);
  if (typeof indexedDB === "undefined") return;
  const db = await openDraftDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const store = db.transaction(FILE_STORE, "readwrite").objectStore(FILE_STORE);
      const request = file
        ? store.put(file, namedFileKey(uid, draftId, kind))
        : store.delete(namedFileKey(uid, draftId, kind));
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("draft_file_write_failed"));
    });
  } finally {
    db.close();
  }
}

export async function clearNamedUploadDraftFiles(uid: string, draftId: string) {
  await Promise.all(
    (["full", "thumbnail", "prologue", "promo"] as const).map((kind) =>
      writeNamedUploadDraftFile(uid, draftId, kind, null)
    )
  );
}

export async function clearUploadDraftFiles(uid: string) {
  await Promise.all(
    (["full", "thumbnail", "prologue", "promo"] as const).map((kind) =>
      writeUploadDraftFile(uid, kind, null)
    )
  );
}
