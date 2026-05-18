import {
  cert,
  applicationDefault,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let cachedApp: App | null | undefined;

/**
 * Firebase Admin app for server routes. Configure either:
 * - FIREBASE_SERVICE_ACCOUNT_JSON — stringified service account JSON, or
 * - Google Application Default Credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS).
 */
export function getFirebaseAdminApp(): App | null {
  if (cachedApp !== undefined) return cachedApp;

  if (getApps().length > 0) {
    cachedApp = getApps()[0]!;
    return cachedApp;
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as ServiceAccount;
      cachedApp = initializeApp({ credential: cert(parsed) });
      return cachedApp;
    } catch (e) {
      console.error("[firebase-admin] Invalid FIREBASE_SERVICE_ACCOUNT_JSON", e);
      cachedApp = null;
      return null;
    }
  }

  try {
    cachedApp = initializeApp({ credential: applicationDefault() });
    return cachedApp;
  } catch {
    cachedApp = null;
    return null;
  }
}

export function getAdminAuth() {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getAuth(app);
}

export function getAdminDb() {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getFirestore(app);
}

export async function verifyBearerIdToken(
  authHeader: string | null
): Promise<{ uid: string; email?: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const auth = getAdminAuth();
  if (!auth) return null;
  try {
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
