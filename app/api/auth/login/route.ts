import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession, isSameOrigin, REMEMBER_SECONDS, SESSION_COOKIE, SESSION_SECONDS } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "ไม่อนุญาตคำขอจากเว็บไซต์อื่น" }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 }); }
  if (!body || typeof body.username !== "string" || typeof body.password !== "string" || !body.username.trim() || !body.password || body.username.length > 200 || body.password.length > 200) return NextResponse.json({ error: "กรุณากรอกบัญชีผู้ใช้และรหัสผ่านให้ถูกต้อง" }, { status: 400 });
  try {
    const user = authenticate(body.username.trim(), body.password);
    if (!user) return NextResponse.json({ error: "บัญชีผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    const remember = body.remember === true;
    const duration = remember ? REMEMBER_SECONDS : SESSION_SECONDS;
    const response = NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(SESSION_COOKIE, createSession(user, duration), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", ...(remember ? { maxAge: duration } : {}) });
    return response;
  } catch {
    return NextResponse.json({ error: "ระบบเข้าสู่ระบบยังไม่ได้ตั้งค่าบัญชีผู้ใช้ กรุณาติดต่อผู้ดูแลระบบ" }, { status: 503 });
  }
}
