import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, expectedToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user: string = body?.user ?? "";
  const pass: string = body?.pass ?? "";

  const envUser = process.env.FARMER_USER || "farmer";
  const envPass = process.env.FARMER_PASSWORD || "";

  if (!envPass || user !== envUser || pass !== envPass) {
    return NextResponse.json({ error: "Wrong username or password" }, { status: 401 });
  }

  const token = await expectedToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
