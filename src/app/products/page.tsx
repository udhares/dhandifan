import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import ProductGrid, { PublicListing } from "@/components/ProductGrid";

export const dynamic = "force-dynamic";

async function getListings(): Promise<PublicListing[]> {
  await connectDB();
  const docs = await Listing.find({ active: true }).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(docs));
}

export default async function ProductsPage() {
  const listings = await getListings();
  return <ProductGrid listings={listings} />;
}
