/** 클라이언트 — Firestore 스테이징 메타 등록 */
export async function patchWorkStagingMeta(
  token: string,
  workId: string,
  payload: {
    full?: { path: string; bytes: number; contentType: string };
    promo?: { path: string; bytes: number; contentType: string };
  }
): Promise<void> {
  const res = await fetch(`/api/me/works/${workId}/staging`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 300) || `HTTP ${res.status}`);
  }
}
