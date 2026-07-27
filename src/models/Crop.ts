import { Schema, model, models, InferSchemaType } from "mongoose";

const TaskSchema = new Schema(
  { job: String, dueDate: Date, done: { type: Boolean, default: false } },
  { _id: false }
);

const InputSchema = new Schema(
  { item: String, quantity: String, cost: Number },
  { _id: false }
);

const CropSchema = new Schema(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: "Farmer", required: true },
    name: { type: String, required: true },
    variety: { type: String, default: "" },
    plot: { type: String, default: "" },
    plantedDate: Date,
    harvestDate: Date,
    expectedQty: { type: Number, default: 0 },
    unit: { type: String, default: "kg" },
    stage: {
      type: String,
      enum: ["planted", "growing", "ready", "harvested"],
      default: "growing",
    },
    actualYield: { type: Number },
    tasks: { type: [TaskSchema], default: [] },
    inputs: { type: [InputSchema], default: [] },
    emoji: { type: String, default: "🌱" },
  },
  { timestamps: true }
);

export type CropDoc = InferSchemaType<typeof CropSchema>;
export default models.Crop || model("Crop", CropSchema);
