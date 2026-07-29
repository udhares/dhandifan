import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import { getCustomerId } from "@/lib/customerAuth";

export async function GET(req: NextRequest) {
  const id = await getCustomerId(req);
  if (!id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    await connectDB();
    const customer = await Customer.findById(id).lean<{ name: string; phone: string; points: number; savedAddress: string } | null>();
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const orders = await Order.find({ customerId: id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      customer: { name: customer.name, phone: customer.phone, points: customer.points, savedAddress: customer.savedAddress },
      orders,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load account" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const id = await getCustomerId(req);
  if (!id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const savedAddress: string = body?.savedAddress ?? "";
    await Customer.findByIdAndUpdate(id, { savedAddress });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not update" }, { status: 400 });
  }
}
