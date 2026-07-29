import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getDefaultFarmer } from "@/lib/farmer";
import { getCustomerId } from "@/lib/customerAuth";
import Listing from "@/models/Listing";
import Order from "@/models/Order";
import Customer from "@/models/Customer";

type OrderItemInput = { listingId: string; qty: number };
type BuiltItem = { listingId: unknown; title: string; qty: number; price: number };

const STATUSES = ["new", "confirmed", "packed", "out", "delivered", "cancelled"];
const PAYMENTS = ["unpaid", "submitted", "paid"];
const POINTS_PER_MVR = 0.1; // 1 point per MVR 10 spent

function bankDetails() {
  return {
    bank: process.env.BML_BANK || "Bank of Maldives",
    name: process.env.BML_ACCOUNT_NAME || "",
    account: process.env.BML_ACCOUNT_NUMBER || "",
  };
}

// GET -> list the farmer's orders (newest first)
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

// POST -> place a new order (guest OR signed-in customer)
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
    const customerId = await getCustomerId(req); // null if guest

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
      customerId: customerId || undefined,
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
      {
        ok: true,
        orderId: String(order._id),
        ref: String(order._id).slice(-6).toUpperCase(),
        total,
        pointsToEarn: Math.floor(total * POINTS_PER_MVR),
        bank: bankDetails(),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not place order" }, { status: 400 });
  }
}

// PATCH -> update status / payment; award loyalty points when delivered
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const id: string = body?.id ?? "";
    const status: string = body?.status ?? "";
    const paymentStatus: string = body?.paymentStatus ?? "";
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (status && !STATUSES.includes(status)) return NextResponse.json({ error: "Bad status" }, { status: 400 });
    if (paymentStatus && !PAYMENTS.includes(paymentStatus)) return NextResponse.json({ error: "Bad payment status" }, { status: 400 });

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    // Award loyalty points once, when the order is delivered to a signed-in customer.
    if (order.status === "delivered" && order.customerId && !order.pointsAwarded) {
      const total = order.items.reduce((s: number, i: { price: number; qty: number }) => s + i.price * i.qty, 0);
      const pts = Math.floor(total * POINTS_PER_MVR);
      if (pts > 0) await Customer.findByIdAndUpdate(order.customerId, { $inc: { points: pts } });
      order.pointsAwarded = true;
    }

    await order.save();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not update order" }, { status: 400 });
  }
}
