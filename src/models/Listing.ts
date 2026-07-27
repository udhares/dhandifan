import { Schema, model, models, InferSchemaType, Types } from "mongoose";

const ListingSchema = new Schema(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: "Farmer", required: true },
    cropId: { type: Schema.Types.ObjectId, ref: "Crop" },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["Fruit", "Vegetable", "Herb", "Other"],
      default: "Vegetable",
    },
    price: { type: Number, required: true }, // in MVR
    unit: { type: String, enum: ["kg", "bunch", "bundle", "piece"], default: "kg" },
    stock: { type: Number, default: 0 },
    emoji: { type: String, default: "🥬" },
    photoUrl: { type: String, default: "" },
    description: { type: String, default: "" },
    certified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type ListingDoc = InferSchemaType<typeof ListingSchema> & { _id: Types.ObjectId };
export default models.Listing || model("Listing", ListingSchema);
