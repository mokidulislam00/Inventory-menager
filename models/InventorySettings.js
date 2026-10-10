import mongoose from "mongoose";

const inventorySettingsSchema = new mongoose.Schema(
  { _id: String },
  { versionKey: false, collection: "inventory_settings" }
);

export default mongoose.models.InventorySettings ||
  mongoose.model("InventorySettings", inventorySettingsSchema);
