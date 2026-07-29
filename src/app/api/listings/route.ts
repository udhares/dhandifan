import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getDefaultFarmer } from "@/lib/farmer";
import Listing from "@/models/Listing";

// GET /api/listings         -> active listings (public shop)
// GET /api/listings?all=1   -> all listings (farmer view)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const all = new URL(req.url).searchParams.get("all");
    const filter = all ? {} : { active: true };
    const listings = await Listing.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json(listings);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load listings" }, { status: 500 });
  }
}

// POST /api/listings -> create a listing
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const farmer = await getDefaultFarmer();
    const listing = await Listing.create({
      farmerId: farmer._id,
      title: body.title,
      category: body.category,
      price: Number(body.price),
      unit: body.unit,
      stock: Number(body.stock) || 0,
      emoji: body.emoji || "🥬",
      photoUrl: body.photoUrl || "",
      description: body.description || "",
      certified: !!body.certified,
      active: body.active !== false,
    });
    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create listing" }, { status: 400 });
  }
}

// PATCH /api/listings -> update a listing (edit fields, or hide/show via active)
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const allowed = ["title", "category", "price", "unit", "stock", "emoji", "photoUrl", "description", "certified", "active"];
    const update: Record<string, unknown> = {};
    for (const k of allowed) if (k in body) update[k] = body[k];
    if ("price" in update) update.price = Number(update.price);
    if ("stock" in update) update.stock = Number(update.stock) || 0;

    const updated = await Listing.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not update listing" }, { status: 400 });
  }
}

// DELETE /api/listings?id=... -> permanently remove a listing
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await Listing.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not delete listing" }, { status: 400 });
  }
}
