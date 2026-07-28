import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

// POST -> a customer submits their bank-transfer reference for an order
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const orderId: string = body?.orderId ?? "";
    const paymentRef: string = body?.paymentRef ?? "";
    if (!orderId || !paymentRef.trim()) {
      return NextResponse.json({ error: "Missing order or reference" }, { status: 400 });
    }
    const updated = await Order.findByIdAndUpdate(
      orderId,
      { paymentRef: paymentRef.trim(), paymentStatus: "submitted" },
      { new: true }
    ).lean();
    if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not submit reference" }, { status: 400 });
  }
}
