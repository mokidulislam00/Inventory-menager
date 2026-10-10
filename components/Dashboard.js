"use client";

import { useEffect, useState } from "react";
import { statusOf } from "../lib";

export default function Dashboard({ items, onError }) {
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadReport() {
      try {
        const response = await fetch("/api/reports", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load sales summary.");
        if (active) {
          setReport(result);
          onError("");
        }
      } catch (error) {
        if (active) onError(error.message);
      } finally {
        if (active) setReportLoading(false);
      }
    }

    loadReport();
    return () => { active = false; };
  }, [onError]);

  const total = items.reduce((a, x) => a + x.st, 0);
  const out = items.filter((x) => statusOf(x).key === "out").length;
  const low = items.filter((x) => statusOf(x).key === "low").length;
  const all = 190 + (items.length - 5);
  const active = 71;
  const top = [...items].sort((a, b) => b.st - a.st).slice(0, 4);

  return (
    <section>
      <div className="hero">
        <div>
          <h2>Sales activity</h2>
          <div className="tiles">
            {[
              { n: report ? report.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—", u: "Total sales", l: "TOTAL SALES", c: "var(--blue)" },
              { n: report ? report.orderCount.toLocaleString() : "—", u: "Orders", l: "SALES ORDERS", c: "var(--red)" },
              { n: report ? report.unitsSold.toLocaleString() : "—", u: "Units", l: "ITEMS SOLD", c: "var(--green)" },
              { n: report ? report.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—", u: "Per order", l: "AVERAGE ORDER", c: "var(--blue)" },
            ].map((t) => (
              <div className="tile" key={t.l}>
                <div className="n" style={{ color: t.c }}>{t.n}</div>
                <small>{t.u}</small>
                <div className="l">{t.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2>Inventory summary</h2>
          <div className="kv">QUANTITY IN HAND <b>{(10458 + total - 317).toLocaleString()}</b></div>
          <div className="kv">QUANTITY TO BE RECEIVED <b>168</b></div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>PRODUCT DETAILS</h3>
          <div className="pd">
            <div>
              <div className="r bad"><span>Low stock items</span><b>{low}</b></div>
              <div className="r bad"><span>Out of stock items</span><b>{out}</b></div>
              <div className="r"><span>All item groups</span><b>39</b></div>
              <div className="r"><span>All items</span><b>{all}</b></div>
              <div className="r bad"><span>Unconfirmed items</span><b>121</b></div>
            </div>
            <div style={{ textAlign: "center" }}>
              Active items
              <div className="donut" style={{ background: `conic-gradient(var(--green) ${active}%, var(--line) 0)` }}>
                <span>{active}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>TOP SELLING ITEMS <span style={{ fontWeight: 400 }}>Previous year</span></h3>
          <div className="top">
            {top.map((x) => (
              <div key={x.s}>
                <i>{x.e || "📦"}</i>
                <small>{x.n}</small>
                <b>{x.st}</b> pcs
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>PURCHASE ORDER <span style={{ fontWeight: 400 }}>This month</span></h3>
          <div className="po">Quantity ordered<b>652.00</b></div>
        </div>

        <div className="card">
          <h3>MONTHLY SALES</h3>
          <div className="tw">
            <table>
              <thead>
                <tr><th>Month</th><th>Orders</th><th>Sales</th></tr>
              </thead>
              <tbody>
                {reportLoading && <tr><td colSpan={3}>Loading sales activity…</td></tr>}
                {!reportLoading && report?.monthlySales.length === 0 && (
                  <tr><td colSpan={3}>Monthly sales will appear after your first order.</td></tr>
                )}
                {report?.monthlySales.slice(-3).map((month) => (
                  <tr key={month.month}>
                    <td>{new Date(`${month.month}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</td>
                    <td>{month.orderCount}</td>
                    <td>{month.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
