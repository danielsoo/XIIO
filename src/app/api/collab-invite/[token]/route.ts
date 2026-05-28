import { NextResponse } from "next/server";
import {
  buildCollabInvitePublicView,
  findCollabInviteByToken,
} from "@/lib/server/collab-invites";
import { verifyBearerIdToken } from "@/lib/server/firebase-admin";
import { getDbOrNull } from "@/lib/server/works";
import { parseUserProfileDoc } from "@/lib/userAccess";

type Params = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: Params) {
  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const db = await getDbOrNull();
  if (!db) {
    return NextResponse.json({ error: "admin_not_configured" }, { status: 503 });
  }

  const invite = await findCollabInviteByToken(db, token.trim());
  if (!invite) {
    return NextResponse.json({ error: "invite_not_found" }, { status: 404 });
  }

  const ownerSnap = await db.collection("users").doc(invite.ownerUid).get();
  const ownerProfile = ownerSnap.exists
    ? parseUserProfileDoc(ownerSnap.data() as Record<string, unknown>)
    : null;
  const ownerDisplayName =
    ownerProfile?.displayName || ownerProfile?.defaultDirectorName || "XIIO";

  const session = await verifyBearerIdToken(request.headers.get("authorization"));

  const view = buildCollabInvitePublicView(invite, ownerDisplayName, {
    viewerUid: session?.uid ?? null,
    viewerEmail: session?.email ?? null,
  });

  return NextResponse.json({ invite: view });
}
