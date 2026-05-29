const MAX_STREAM_DISPLAY_NAME_LEN = 200;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC `YYYY.MM.DD_HH.mm.ss` */
export function formatStreamDisplayNameTimestamp(at: Date): string {
  const y = at.getUTCFullYear();
  const mo = pad2(at.getUTCMonth() + 1);
  const day = pad2(at.getUTCDate());
  const h = pad2(at.getUTCHours());
  const mi = pad2(at.getUTCMinutes());
  const s = pad2(at.getUTCSeconds());
  return `${y}.${mo}.${day}_${h}.${mi}.${s}`;
}

export function buildStreamDisplayName(opts: {
  ownerUid: string;
  workId: string;
  kind: string;
  at?: Date;
}): string {
  const stamp = formatStreamDisplayNameTimestamp(opts.at ?? new Date());
  const suffix = `_${opts.ownerUid}_${opts.kind}_${opts.workId}`;
  const full = `${stamp}${suffix}`;

  if (full.length <= MAX_STREAM_DISPLAY_NAME_LEN) {
    return full;
  }

  const maxStampLen = MAX_STREAM_DISPLAY_NAME_LEN - suffix.length;
  if (maxStampLen >= 10) {
    return `${stamp.slice(0, maxStampLen)}${suffix}`;
  }

  return full.slice(0, MAX_STREAM_DISPLAY_NAME_LEN);
}

/** Cloudflare dashboard `meta.name` from XIIO upload metadata keys. */
export function streamDisplayNameFromXiioMeta(
  meta: Record<string, string>,
  at?: Date
): string | null {
  const ownerUid = meta.xiio_uid?.trim();
  const workId = meta.xiio_work_id?.trim();
  const kind = meta.xiio_kind?.trim();
  if (!ownerUid || !workId || !kind) return null;
  return buildStreamDisplayName({ ownerUid, workId, kind, at });
}

export function withStreamDisplayName(meta: Record<string, string>, at?: Date): Record<string, string> {
  const displayName = streamDisplayNameFromXiioMeta(meta, at);
  if (!displayName) return meta;

  const { title: _title, ...rest } = meta;
  return { ...rest, name: displayName };
}
