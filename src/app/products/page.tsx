import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import ProductGrid, { PublicListing } from "@/components/ProductGrid";

// Always fetch fresh data for the MVP.
export const dynamic = "force-dynamic";

async function getListings(): Promise<PublicListing[]> {
  await connectDB();
  const docs = await Listing.find({ active: true }).sort({ createdAt: -1 }).lean();
  // Convert Mongo types (ObjectId, Date) into plain JSON for the client component.
  return JSON.parse(JSON.stringify(docs));
}

export default async function ProductsPage() {
  const listings = await getListings();
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#14472f", margin: 0 }}>
        Fresh from Dhandifan
      </h1>
      <p style={{ color: "#6b7c71", marginTop: 6, marginBottom: 24 }}>
        Island produce, picked and listed by the farmer. Browse and order.
      </p>
      <ProductGrid listings={listings} />
    </div>
  );
}
