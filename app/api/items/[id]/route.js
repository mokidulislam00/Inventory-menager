import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../../../lib/mongodb";
import Item from "../../../../models/Item";

function serializeItem(item) {
  return {
    _id: item._id.toString(),
    n: item.n,
    s: item.s,
    price: item.price ?? 0,
    st: item.st,
    ro: item.ro,
    e: item.e,
  };
}

export async function PATCH(request, { params }) {
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid item ID." }, { status: 400 });
  }

  try {
    const body = await request.json();
    if (!body || !Number.isFinite(body.price) || body.price < 0) {
      return NextResponse.json({ error: "Provide a non-negative item price." }, { status: 400 });
    }

    await dbConnect();
    const item = await Item.findByIdAndUpdate(
      params.id,
      { $set: { price: Math.round(body.price * 100) / 100 } },
      { returnDocument: "after", runValidators: true }
    );
    if (!item) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }
    return NextResponse.json(serializeItem(item));
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    console.error("Failed to update item price:", error);
    return NextResponse.json({ error: "Could not update item price in MongoDB." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid item ID." }, { status: 400 });
  }

  try {
    await dbConnect();
    const result = await Item.findByIdAndDelete(params.id);
    if (!result) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete inventory item:", error);
    return NextResponse.json({ error: "Could not delete item from MongoDB." }, { status: 500 });
  }
}
