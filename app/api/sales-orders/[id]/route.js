import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import Item from "../../../../models/Item";
import SalesOrder from "../../../../models/SalesOrder";

class MissingInventoryItemError extends Error {}

export async function DELETE(request, { params }) {
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid sales order ID." }, { status: 400 });
  }

  let session;
  try {
    await dbConnect();
    session = await mongoose.startSession();
    let deletedOrder;

    await session.withTransaction(async () => {
      const order = await SalesOrder.findById(params.id).session(session);
      if (!order) return;

      for (const line of order.items) {
        const item = await Item.findByIdAndUpdate(
          line.itemId,
          { $inc: { st: line.quantity } },
          { returnDocument: "after", session }
        );
        if (!item) throw new MissingInventoryItemError();
      }

      const result = await SalesOrder.deleteOne({ _id: order._id }, { session });
      if (result.deletedCount !== 1) {
        throw new Error("Sales order could not be deleted.");
      }
      deletedOrder = order;
    });

    if (!deletedOrder) {
      return NextResponse.json({ error: "Sales order not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, restoredItems: deletedOrder.items.length });
  } catch (error) {
    if (error instanceof MissingInventoryItemError) {
      return NextResponse.json(
        { error: "A product in this order no longer exists. The order was not deleted and stock was not changed." },
        { status: 409 }
      );
    }
    console.error("Failed to delete sales order:", error);
    return NextResponse.json({ error: "Could not delete sales order from MongoDB." }, { status: 500 });
  } finally {
    if (session) await session.endSession();
  }
}
