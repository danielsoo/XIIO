import { redirect } from "next/navigation";

/** 시청 프로필 선택 화면 제거 — 계정 프로필로 통합 */
export default function ProfilesPage() {
  redirect("/account");
}
