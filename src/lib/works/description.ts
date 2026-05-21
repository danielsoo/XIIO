/** 관리자 검수·프로모 플레이어 공통 — 접기/스크롤 펼침 대상 여부 */
export function isLongDescription(value: string): boolean {
  const text = value.trim();
  if (!text || text === "—") return false;
  return text.length > 160 || (text.match(/\n/g)?.length ?? 0) >= 3;
}
