"use client";

import { useEffect, useState } from "react";

function formatAmount(amount) {
  return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMonth(month) {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function Reports({ onError }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadReport() {
      try {
        const response = await fetch("/api/reports", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load reports.");
        if (active) {
          setReport(result);
          onError("");
        }
      } catch (error) {
        if (active) onError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReport();
    return () => { active = false; };
  }, [onError]);

  return (
    <div className="grid">
      <div className="card wide">
        <h3>SALES SUMMARY</h3>
        {loading && <p className="empty-message">Loading reports…</p>}
        {!loading && report && (
          <div className="report-metrics">
            <div><span>Total sales</span><b>{formatAmount(report.revenue)}</b></div>
            <div><span>Sales orders</span><b>{report.orderCount.toLocaleString()}</b></div>
            <div><span>Items sold</span><b>{report.unitsSold.toLocaleString()}</b></div>
            <div><span>Average order</span><b>{formatAmount(report.averageOrderValue)}</b></div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>TOP SELLING ITEMS</h3>
        <div className="tw">
          <table>
            <thead><tr><th>Item</th><th>Units</th><th>Sales</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={3}>Loading…</td></tr>}
              {!loading && report?.topItems.length === 0 && (
                <tr><td colSpan={3}>Create a sales order to see best sellers.</td></tr>
              )}
              {report?.topItems.map((item) => (
                <tr key={item.sku}>
                  <td>{item.name}<small className="report-sku">{item.sku}</small></td>
                  <td>{item.unitsSold}</td>
                  <td>{formatAmount(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>MONTHLY SALES</h3>
        <div className="tw">
          <table>
            <thead><tr><th>Month</th><th>Orders</th><th>Sales</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={3}>Loading…</td></tr>}
              {!loading && report?.monthlySales.length === 0 && (
                <tr><td colSpan={3}>Monthly sales will appear after your first order.</td></tr>
              )}
              {report?.monthlySales.map((month) => (
                <tr key={month.month}>
                  <td>{formatMonth(month.month)}</td>
                  <td>{month.orderCount}</td>
                  <td>{formatAmount(month.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
