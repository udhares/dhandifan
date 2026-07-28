import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getDefaultFarmer } from "@/lib/farmer";
import Listing from "@/models/Listing";
import Order from "@/models/Order";

type OrderItemInput = { listingId: string; qty: number };
type BuiltItem = { listingId: unknown; title: string; qty: number; price: number };

const STATUSES = ["new", "confirmed", "packed", "out", "delivered", "cancelled"];

// GET /api/orders -> list the farmer's orders (newest first)
export async function GET() {
  try {
    await connectDB();
    const farmer = await getDefaultFarmer();
    const orders = await Order.find({ farmerId: farmer._id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(orders);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load orders" }, { status: 500 });
  }
}

// POST /api/orders -> place a new order (guest checkout)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const buyerName: string = body?.buyerName ?? "";
    const buyerPhone: string = body?.buyerPhone ?? "";
    const deliveryMethod: string = body?.deliveryMethod ?? "";
    const address: string = body?.address ?? "";
    const items: OrderItemInput[] = Array.isArray(body?.items) ? body.items : [];

    if (!buyerName.trim() || !buyerPhone.trim() || items.length === 0) {
      return NextResponse.json({ error: "Missing name, phone, or items" }, { status: 400 });
    }

    const farmer = await getDefaultFarmer();

    const orderItems: BuiltItem[] = [];
    for (const it of items) {
      const listing = await Listing.findById(it.listingId)
        .lean<{ _id: unknown; title: string; price: number } | null>();
      if (!listing) continue;
      const qty = Math.max(1, Number(it.qty) || 1);
      orderItems.push({ listingId: listing._id, title: listing.title, qty, price: listing.price });
    }
    if (orderItems.length === 0) {
      return NextResponse.json({ error: "No valid items in cart" }, { status: 400 });
    }

    const order = await Order.create({
      farmerId: farmer._id,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      items: orderItems,
      deliveryMethod,
      note: address ? `Delivery address: ${address}` : "",
      status: "new",
      paymentStatus: "unpaid",
    });

    const total = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
    return NextResponse.json(
      { ok: true, ref: String(order._id).slice(-6).toUpperCase(), total },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not place order" }, { status: 400 });
  }
}

// PATCH /api/orders -> update an order's status
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const id: string = body?.id ?? "";
    const status: string = body?.status ?? "";
    if (!id || !STATUSES.includes(status)) {
      return NextResponse.json({ error: "Missing id or invalid status" }, { status: 400 });
    }
    const updated = await Order.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not update order" }, { status: 400 });
  }
}
