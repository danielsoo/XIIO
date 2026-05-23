import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/server/firebase-admin";

export type SocialProvider = "kakao" | "naver";

export const ADMIN_NOT_CONFIGURED = "ADMIN_NOT_CONFIGURED";
export const ACCOUNT_EXISTS = "ACCOUNT_EXISTS";

function linkDocId(provider: SocialProvider, providerUserId: string): string {
  return `${provider}_${providerUserId}`;
}

export async function findOrCreateFirebaseUser(params: {
  provider: SocialProvider;
  providerUserId: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<{ uid: string; customToken: string }> {
  const adminAuth = getAdminAuth();
  const db = getAdminDb();
  if (!adminAuth || !db) {
    const err = new Error(ADMIN_NOT_CONFIGURED);
    throw err;
  }

  const linkRef = db.collection("authLinks").doc(linkDocId(params.provider, params.providerUserId));
  const existing = await linkRef.get();
  if (existing.exists) {
    const uid = existing.data()?.uid as string;
    if (!uid) throw new Error("INVALID_AUTH_LINK");
    const customToken = await adminAuth.createCustomToken(uid, {
      socialProvider: params.provider,
    });
    return { uid, customToken };
  }

  const createParams: {
    email?: string;
    displayName?: string;
    emailVerified?: boolean;
  } = {};

  const normalizedEmail = params.email?.trim().toLowerCase();
  if (normalizedEmail) {
    createParams.email = normalizedEmail;
    createParams.emailVerified = true;
  }
  if (params.displayName?.trim()) {
    createParams.displayName = params.displayName.trim().slice(0, 120);
  }

  let userRecord;
  try {
    userRecord = await adminAuth.createUser(createParams);
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code: unknown }).code)
        : "";
    if (code === "auth/email-already-exists") {
      throw new Error(ACCOUNT_EXISTS);
    }
    throw e;
  }

  await linkRef.set({
    uid: userRecord.uid,
    provider: params.provider,
    providerUserId: params.providerUserId,
    createdAt: FieldValue.serverTimestamp(),
  });

  const customToken = await adminAuth.createCustomToken(userRecord.uid, {
    socialProvider: params.provider,
  });
  return { uid: userRecord.uid, customToken };
}

export function getRequestOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;

  return "http://localhost:3000";
}
