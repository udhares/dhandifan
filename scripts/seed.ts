import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import Farmer from "../src/models/Farmer";
import Listing from "../src/models/Listing";

async function run() {
  await connectDB();

  await Farmer.deleteMany({});
  await Listing.deleteMany({});

  const farmer = await Farmer.create({
    name: "Ahmed Waheed",
    farmName: "Dhandifan",
    island: "Thoddoo",
    atoll: "Alif Alif",
    certified: true,
  });

  const items = [
    { emoji: "🥒", title: "Fresh Cucumber", category: "Vegetable", price: 22, unit: "kg", stock: 150, certified: true, description: "Crisp local cucumbers, picked this morning." },
    { emoji: "🌶️", title: "Githeyo Mirus (Chilli)", category: "Vegetable", price: 180, unit: "kg", stock: 45, certified: true, description: "Hot local chilli, resort-grade." },
    { emoji: "🍌", title: "Dhaka Banana", category: "Fruit", price: 35, unit: "bunch", stock: 80, certified: false, description: "Sweet ripe bananas by the bunch." },
    { emoji: "🍃", title: "Curry Leaves", category: "Herb", price: 15, unit: "bundle", stock: 0, certified: false, description: "Fresh aromatic curry leaves." },
    { emoji: "🍉", title: "Thoddoo Watermelon", category: "Fruit", price: 28, unit: "kg", stock: 300, certified: true, description: "The famous Thoddoo watermelon." },
  ];

  await Listing.create(items.map((i) => ({ ...i, farmerId: farmer._id })));

  console.log(`Seeded 1 farmer and ${items.length} listings.`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
