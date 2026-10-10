"use client";

import { useEffect, useState } from "react";

const newLine = (item = null) => ({
  itemId: item?._id || "",
  quantity: "1",
  unitPrice: String(item?.price ?? 0),
});

function formatAmount(amount) {
  return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SalesOrders({ items, onCreateOrder, onDeleteOrder, onError }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [customer, setCustomer] = useState("");
  const [lines, setLines] = useState([newLine()]);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const response = await fetch("/api/sales-orders", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load sales orders.");
        if (active) {
          setOrders(result);
          onError("");
        }
      } catch (error) {
        if (active) onError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrders();
    return () => { active = false; };
  }, [onError]);

  useEffect(() => {
    if (items.length && !lines[0].itemId) {
      setLines((current) => current.map((line, index) =>
        index === 0 ? { ...line, itemId: items[0]._id, unitPrice: String(items[0].price ?? 0) } : line
      ));
    }
  }, [items, lines]);

  function updateLine(index, field, value) {
    setLines((current) => current.map((line, lineIndex) =>
      lineIndex === index ? { ...line, [field]: value } : line
    ));
  }

  async function saveOrder(event) {
    event.preventDefault();
    setSaving(true);
    const order = await onCreateOrder({
      customer,
      items: lines.map((line) => ({
        itemId: line.itemId,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
      })),
    });
    if (order) {
      setOrders((current) => [order, ...current].slice(0, 200));
      setCustomer("");
      setLines([newLine(items[0])]);
    }
    setSaving(false);
  }

  async function deleteOrder(order) {
    if (!window.confirm(`Delete this order and return its products to inventory?\n\nOrder total: ${formatAmount(order.total)}`)) {
      return;
    }

    setDeleting(order._id);
    const deleted = await onDeleteOrder(order);
    if (deleted) setOrders((current) => current.filter((entry) => entry._id !== order._id));
    setDeleting("");
  }

  const orderTotal = lines.reduce(
    (total, line) => total + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0),
    0
  );

  return (
    <div className="grid">
      <div className="card wide">
        <h3>NEW SALES ORDER</h3>
        <form onSubmit={saveOrder}>
          <div className="form order-customer">
            <input
              value={customer}
              onChange={(event) => setCustomer(event.target.value)}
              placeholder="Customer name"
              aria-label="Customer name"
              maxLength={120}
              required
            />
          </div>
          <div className="order-line-labels" aria-hidden="true">
            <span>Item</span>
            <span>Quantity</span>
            <span>Unit price</span>
            <span />
          </div>
          {lines.map((line, index) => {
            const selectedItem = items.find((item) => item._id === line.itemId);
            return (
              <div className="order-line" key={index}>
                <select
                  value={line.itemId}
                  onChange={(event) => {
                    const item = items.find((entry) => entry._id === event.target.value);
                    setLines((current) => current.map((currentLine, lineIndex) =>
                      lineIndex === index
                        ? { ...currentLine, itemId: event.target.value, unitPrice: String(item?.price ?? 0) }
                        : currentLine
                    ));
                  }}
                  aria-label={`Product ${index + 1}`}
                  required
                  disabled={!items.length}
                >
                  <option value="" disabled>Select item</option>
                  {items.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.n} ({item.s}) — {item.st} in stock
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  step="1"
                  max={selectedItem?.st || undefined}
                  value={line.quantity}
                  onChange={(event) => updateLine(index, "quantity", event.target.value)}
                  aria-label={`Quantity for item ${index + 1}`}
                  placeholder="Qty"
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(event) => updateLine(index, "unitPrice", event.target.value)}
                  aria-label={`Unit price for item ${index + 1}`}
                  placeholder="Unit price"
                  required
                />
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}
                  disabled={lines.length === 1}
                  aria-label={`Remove item ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            );
          })}
          <div className="order-actions">
            <button
              className="btn ghost"
              type="button"
              onClick={() => setLines((current) => [...current, newLine(items[0])])}
              disabled={!items.length || lines.length >= 100}
            >
              + Add item
            </button>
            <span className="order-total">Order total: {formatAmount(orderTotal)}</span>
            <button className="btn" type="submit" disabled={saving || !items.length}>
              {saving ? "Saving…" : "Create order"}
            </button>
          </div>
          {!items.length && !loading && (
            <p className="empty-message">Add an inventory item before creating a sales order.</p>
          )}
          <p className="form-hint">Creating an order immediately deducts its quantities from stock.</p>
        </form>
      </div>

      <div className="card wide">
        <h3>RECENT SALES ORDERS</h3>
        <div className="tw">
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6}>Loading sales orders…</td></tr>}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={6}>No sales orders yet. Create an order above to get started.</td></tr>
              )}
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>SO-{order._id.slice(-6).toUpperCase()}</td>
                  <td>{order.customer}</td>
                  <td>{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</td>
                  <td>{formatAmount(order.total)}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn ghost"
                      onClick={() => deleteOrder(order)}
                      disabled={deleting === order._id}
                    >
                      {deleting === order._id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
