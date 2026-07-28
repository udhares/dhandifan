import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getDefaultFarmer } from "@/lib/farmer";
import Listing from "@/models/Listing";
import Order from "@/models/Order";

type OrderItemInput = { listingId: string; qty: number };
type BuiltItem = { listingId: unknown; title: string; qty: number; price: number };

// POST /api/orders  -> place a new order (guest checkout)
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

    // Build the order from real prices in the database (never trust the client's prices).
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
