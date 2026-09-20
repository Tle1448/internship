import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/auth/server";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  return NextResponse.json({ user: readSession(request.cookies.get(SESSION_COOKIE)?.value) }, { headers: { "Cache-Control": "no-store" } });
}
