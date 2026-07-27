import { Schema, model, models, InferSchemaType } from "mongoose";

const OrderItemSchema = new Schema(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    title: String,
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: "Farmer", required: true },
    buyerName: { type: String, required: true },
    buyerPhone: { type: String, default: "" },
    items: { type: [OrderItemSchema], default: [] },
    status: {
      type: String,
      enum: ["new", "confirmed", "packed", "out", "delivered", "cancelled"],
      default: "new",
    },
    deliveryMethod: { type: String, default: "" },
    deliveryZone: { type: String, default: "" },
    deliveryFee: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export type OrderDoc = InferSchemaType<typeof OrderSchema>;
export default models.Order || model("Order", OrderSchema);
