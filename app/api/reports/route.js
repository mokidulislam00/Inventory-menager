import { NextResponse } from "next/server";
import dbConnect from "../../../lib/mongodb";
import SalesOrder from "../../../models/SalesOrder";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const [report] = await SalesOrder.aggregate([
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                orderCount: { $sum: 1 },
                revenue: { $sum: "$total" },
              },
            },
          ],
          units: [
            { $unwind: "$items" },
            { $group: { _id: null, unitsSold: { $sum: "$items.quantity" } } },
          ],
          topItems: [
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.itemId",
                name: { $first: "$items.name" },
                sku: { $first: "$items.sku" },
                unitsSold: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.lineTotal" },
              },
            },
            { $sort: { unitsSold: -1, revenue: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, name: 1, sku: 1, unitsSold: 1, revenue: 1 } },
          ],
          monthlySales: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                orderCount: { $sum: 1 },
                revenue: { $sum: "$total" },
              },
            },
            { $sort: { _id: -1 } },
            { $limit: 6 },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, month: "$_id", orderCount: 1, revenue: 1 } },
          ],
        },
      },
    ]);

    const summary = report.summary[0] || { orderCount: 0, revenue: 0 };
    return NextResponse.json({
      orderCount: summary.orderCount,
      revenue: summary.revenue,
      unitsSold: report.units[0]?.unitsSold || 0,
      averageOrderValue: summary.orderCount ? summary.revenue / summary.orderCount : 0,
      topItems: report.topItems,
      monthlySales: report.monthlySales,
    });
  } catch (error) {
    console.error("Failed to build sales report:", error);
    return NextResponse.json({ error: "Could not load sales reports from MongoDB." }, { status: 500 });
  }
}
