import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/mongodb";
import Item from "../../../models/Item";
import SalesOrder from "../../../models/SalesOrder";

function serializeOrder(order) {
  return {
    _id: order._id.toString(),
    customer: order.customer,
    items: order.items.map((item) => ({
      itemId: item.itemId.toString(),
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    total: order.total,
    createdAt: order.createdAt,
  };
}

class InsufficientStockError extends Error {}

export async function GET() {
  try {
    await dbConnect();
    const orders = await SalesOrder.find().sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json(orders.map(serializeOrder));
  } catch (error) {
    console.error("Failed to load sales orders:", error);
    return NextResponse.json({ error: "Could not load sales orders from MongoDB." }, { status: 500 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    throw error;
  }

  if (
    !body ||
    typeof body.customer !== "string" ||
    !body.customer.trim() ||
    body.customer.trim().length > 120 ||
    !Array.isArray(body.items) ||
    body.items.length < 1 ||
    body.items.length > 100 ||
    body.items.some(
      (line) =>
        !line ||
        !mongoose.isValidObjectId(line.itemId) ||
        !Number.isSafeInteger(line.quantity) ||
        line.quantity < 1 ||
        !Number.isFinite(line.unitPrice) ||
        line.unitPrice < 0
    )
  ) {
    return NextResponse.json(
      { error: "Provide a customer and at least one valid item, quantity, and non-negative price." },
      { status: 400 }
    );
  }

  const lines = body.items.map((line) => ({
    itemId: new mongoose.Types.ObjectId(line.itemId),
    quantity: line.quantity,
    unitPrice: Math.round(line.unitPrice * 100) / 100,
  }));
  const total = Math.round(
    lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) * 100
  ) / 100;
  if (!Number.isFinite(total) || lines.some((line) => !Number.isFinite(line.quantity * line.unitPrice))) {
    return NextResponse.json({ error: "Order totals must be finite numbers." }, { status: 400 });
  }

  let session;
  try {
    await dbConnect();
    session = await mongoose.startSession();
    const orderId = new mongoose.Types.ObjectId();

    await session.withTransaction(async () => {
      const orderItems = [];

      for (const line of lines) {
        const item = await Item.findOneAndUpdate(
          { _id: line.itemId, st: { $gte: line.quantity } },
          { $inc: { st: -line.quantity } },
          { returnDocument: "after", session }
        );
        if (!item) {
          throw new InsufficientStockError();
        }

        orderItems.push({
          itemId: item._id,
          name: item.n,
          sku: item.s,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: Math.round(line.quantity * line.unitPrice * 100) / 100,
        });
      }

      await new SalesOrder({
        _id: orderId,
        customer: body.customer.trim(),
        items: orderItems,
        total,
      }).save({ session });
    });

    const order = await SalesOrder.findById(orderId).lean();
    return NextResponse.json(serializeOrder(order), { status: 201 });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json(
        { error: "One or more items are unavailable or have insufficient stock. No stock was changed." },
        { status: 409 }
      );
    }
    console.error("Failed to create sales order:", error);
    return NextResponse.json({ error: "Could not create sales order in MongoDB." }, { status: 500 });
  } finally {
    if (session) await session.endSession();
  }
}
