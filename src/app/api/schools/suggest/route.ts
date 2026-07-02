import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/api-auth";
import { getDbOrNull } from "@/lib/server/works";
import { collectSchoolsForSuggestions, filterSchoolSuggestions } from "@/lib/server/schools";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ items: [] });
  }

  const db = await getDbOrNull();
  if (!db) {
    return NextResponse.json({ items: [] });
  }

  const catalog = await collectSchoolsForSuggestions(db);
  const items = filterSchoolSuggestions(catalog, q);
  return NextResponse.json({ items });
}
