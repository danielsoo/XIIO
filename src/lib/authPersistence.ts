import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const REMEMBER_KEY = "xiio_remember_login";
const EMAIL_KEY = "xiio_saved_email";

/** 체크 시 브라우저를 닫아도 로그인 유지, 해제 시 탭/브라우저 종료 시 로그아웃 */
export async function applyAuthPersistence(remember: boolean): Promise<void> {
  if (!auth) return;
  await setPersistence(
    auth,
    remember ? browserLocalPersistence : browserSessionPersistence
  );
}

export function loadRememberLogin(): { remember: boolean; email: string } {
  if (typeof window === "undefined") return { remember: true, email: "" };
  const remember = localStorage.getItem(REMEMBER_KEY) !== "0";
  const email = remember ? (localStorage.getItem(EMAIL_KEY) ?? "") : "";
  return { remember, email };
}

/** 비밀번호는 저장하지 않음 — 이메일·기억하기 여부만 */
export function saveRememberLogin(remember: boolean, email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
  if (remember) {
    localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
  } else {
    localStorage.removeItem(EMAIL_KEY);
  }
}
