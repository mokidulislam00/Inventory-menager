import { NextResponse } from "next/server";
import dbConnect from "../../../lib/mongodb";
import Item from "../../../models/Item";
import InventorySettings from "../../../models/InventorySettings";
import { DEFAULT_ITEMS } from "../../../lib";

const initializationKey = "default-items";
let initializationPromise;

async function initializeItems() {
  const initialized = await InventorySettings.exists({ _id: initializationKey });
  if (initialized) return;

  if (!(await Item.exists())) {
    await Item.insertMany(DEFAULT_ITEMS);
  }
  await InventorySettings.create({ _id: initializationKey });
}

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

export async function GET() {
  try {
    await dbConnect();
    if (!initializationPromise) {
      initializationPromise = initializeItems().catch((error) => {
        initializationPromise = null;
        throw error;
      });
    }
    await initializationPromise;
    const items = await Item.find().sort({ createdAt: 1 }).lean();
    return NextResponse.json(items.map(serializeItem));
  } catch (error) {
    console.error("Failed to load inventory items:", error);
    return NextResponse.json({ error: "Could not load items from MongoDB." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (
      !body ||
      typeof body.n !== "string" ||
      !body.n.trim() ||
      typeof body.s !== "string" ||
      !body.s.trim() ||
      !Number.isFinite(body.price) ||
      body.price < 0 ||
      !Number.isFinite(body.st) ||
      body.st < 0 ||
      !Number.isFinite(body.ro) ||
      body.ro < 0
    ) {
      return NextResponse.json({ error: "Provide a name, SKU, and non-negative stock values." }, { status: 400 });
    }

    await dbConnect();
    const item = await Item.create({
      n: body.n.trim(),
      s: body.s.trim(),
      price: Math.round(body.price * 100) / 100,
      st: body.st,
      ro: body.ro,
      e: typeof body.e === "string" && body.e.trim() ? body.e.trim() : "📦",
    });
    return NextResponse.json(serializeItem(item), { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    console.error("Failed to save inventory item:", error);
    return NextResponse.json({ error: "Could not save item to MongoDB." }, { status: 500 });
  }
}
