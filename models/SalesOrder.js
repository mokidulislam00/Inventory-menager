import mongoose from "mongoose";

const salesOrderLineSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const salesOrderSchema = new mongoose.Schema(
  {
    customer: { type: String, required: true, trim: true, maxlength: 120 },
    items: { type: [salesOrderLineSchema], required: true },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, collection: "sales_orders" }
);

export default mongoose.models.SalesOrder || mongoose.model("SalesOrder", salesOrderSchema);
