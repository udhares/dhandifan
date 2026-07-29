import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE } from "@/lib/customerAuth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CUSTOMER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
