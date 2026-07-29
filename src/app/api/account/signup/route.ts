import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import { CUSTOMER_COOKIE, hashPassword, makeSession } from "@/lib/customerAuth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const name: string = (body?.name ?? "").trim();
    const phone: string = (body?.phone ?? "").trim();
    const password: string = body?.password ?? "";
    if (!name || !phone || password.length < 4) {
      return NextResponse.json({ error: "Name, phone, and a password (4+ chars) are required." }, { status: 400 });
    }
    const existing = await Customer.findOne({ phone });
    if (existing) return NextResponse.json({ error: "That phone number is already registered. Try logging in." }, { status: 409 });

    const { salt, hash } = await hashPassword(password);
    const customer = await Customer.create({ name, phone, passwordSalt: salt, passwordHash: hash, points: 0 });

    const res = NextResponse.json({ ok: true, name: customer.name, points: 0 });
    res.cookies.set(CUSTOMER_COOKIE, await makeSession(String(customer._id)), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create account." }, { status: 400 });
  }
}
