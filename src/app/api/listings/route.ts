import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getDefaultFarmer } from "@/lib/farmer";
import Listing from "@/models/Listing";

// GET /api/listings         -> active listings only (public shop)
// GET /api/listings?all=1   -> every listing (farmer view)
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

// POST /api/listings -> create a new listing
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
