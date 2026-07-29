import { Schema, model, models, InferSchemaType } from "mongoose";

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    passwordSalt: { type: String, required: true },
    passwordHash: { type: String, required: true },
    points: { type: Number, default: 0 },
    savedAddress: { type: String, default: "" },
  },
  { timestamps: true }
);

export type CustomerDoc = InferSchemaType<typeof CustomerSchema>;
export default models.Customer || model("Customer", CustomerSchema);
