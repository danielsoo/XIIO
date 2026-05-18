import { NextResponse } from "next/server";
import { isUploaderDepositEnabled } from "@/lib/payments/config";

export async function GET() {
  return NextResponse.json({ uploaderDepositEnabled: isUploaderDepositEnabled() });
}
