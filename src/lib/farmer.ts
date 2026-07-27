import { connectDB } from "@/lib/db";
import Farmer from "@/models/Farmer";

/**
 * Single-farmer MVP: find the one farmer, or create a default one.
 * Later, when login is added, this is replaced by the logged-in farmer's id.
 */
export async function getDefaultFarmer() {
  await connectDB();
  let farmer = await Farmer.findOne();
  if (!farmer) {
    farmer = await Farmer.create({
      name: "Ahmed Waheed",
      farmName: "Dhandifan",
      island: "Thoddoo",
      atoll: "Alif Alif",
      certified: true,
    });
  }
  return farmer;
}
