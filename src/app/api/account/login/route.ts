import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import { CUSTOMER_COOKIE, verifyPassword, makeSession } from "@/lib/customerAuth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const phone: string = (body?.phone ?? "").trim();
    const password: string = body?.password ?? "";
    const customer = await Customer.findOne({ phone }).lean<{ _id: unknown; name: string; passwordSalt: string; passwordHash: string; points: number } | null>();
    if (!customer || !(await verifyPassword(password, customer.passwordSalt, customer.passwordHash))) {
      return NextResponse.json({ error: "Wrong phone number or password." }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, name: customer.name, points: customer.points });
    res.cookies.set(CUSTOMER_COOKIE, await makeSession(String(customer._id)), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not log in." }, { status: 400 });
  }
}
