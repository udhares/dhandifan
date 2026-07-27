import { Schema, model, models, InferSchemaType } from "mongoose";

const FarmerSchema = new Schema(
  {
    name: { type: String, required: true },
    farmName: { type: String, required: true },
    island: { type: String, default: "" },
    atoll: { type: String, default: "" },
    phone: { type: String, default: "" },
    certified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type FarmerDoc = InferSchemaType<typeof FarmerSchema>;
export default models.Farmer || model("Farmer", FarmerSchema);
