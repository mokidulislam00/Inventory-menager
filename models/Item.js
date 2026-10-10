import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    n: { type: String, required: true, trim: true },
    s: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    st: { type: Number, required: true, min: 0 },
    ro: { type: Number, required: true, min: 0 },
    e: { type: String, default: "📦" },
  },
  { timestamps: true }
);

export default mongoose.models.Item || mongoose.model("Item", itemSchema);
