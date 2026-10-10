"use client";

import { useCallback, useEffect, useState } from "react";
import Dashboard from "../components/Dashboard";
import Items from "../components/Items";
import Reports from "../components/Reports";
import SalesOrders from "../components/SalesOrders";

const TABS = [
  ["dash", "Dashboard"],
  ["items", "Items"],
  ["sales", "Sales orders"],
  ["reports", "Reports"],
];

export default function Page() {
  const [tab, setTab] = useState("dash");
  const [showNewItem, setShowNewItem] = useState(false);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadItems() {
      try {
        const response = await fetch("/api/items", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load items.");
        if (active) setItems(result);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadItems();
    return () => { active = false; };
  }, []);

  async function addItem(item) {
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save item.");
      setItems((current) => [...current, result]);
      setError("");
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  async function updateItemPrice(id, price) {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update item price.");
      setItems((current) => current.map((item) => item._id === id ? result : item));
      setError("");
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  async function deleteItem(id) {
    try {
      const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete item.");
      setItems((current) => current.filter((item) => item._id !== id));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function addSalesOrder(order) {
    try {
      const response = await fetch("/api/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create sales order.");

      setItems((current) => current.map((item) => ({
        ...item,
        st: item.st - result.items
          .filter((line) => line.itemId === item._id)
          .reduce((quantity, line) => quantity + line.quantity, 0),
      })));
      setError("");
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }

  async function deleteSalesOrder(order) {
    try {
      const response = await fetch(`/api/sales-orders/${order._id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete sales order.");

      setItems((current) => current.map((item) => ({
        ...item,
        st: item.st + order.items
          .filter((line) => line.itemId === item._id)
          .reduce((quantity, line) => quantity + line.quantity, 0),
      })));
      setError("");
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  const showError = useCallback((message) => {
    setError(message);
  }, []);

  function toggleTheme() {
    const r = document.documentElement;
    const dark = r.dataset.theme
      ? r.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    r.dataset.theme = dark ? "light" : "dark";
  }

  function onSearch(e) {
    setQuery(e.target.value);
    if (tab !== "items") setTab("items");
  }

  return (
    <div className="shell">
      <aside>
        <div className="logo"><b>▣</b> Inventory</div>
        {TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </aside>

      <main>
        <header>
          <input placeholder="Search items" aria-label="Search items" value={query} onChange={onSearch} />
          <span className="sp" />
          <button className="btn ghost" onClick={toggleTheme}>Toggle theme</button>
          {tab === "items" && (
            <button
              className="btn"
              onClick={() => setShowNewItem((current) => !current)}
              aria-expanded={showNewItem}
              aria-controls="new-item-form"
            >
              {showNewItem ? "Close form" : "+ New item"}
            </button>
          )}
        </header>

        {error && <p className="error" role="alert">{error}</p>}
        {tab === "dash" && <Dashboard items={items} onError={showError} />}
        {tab === "items" && (
          <Items
            items={items}
            onAdd={addItem}
            onUpdatePrice={updateItemPrice}
            onDelete={deleteItem}
            query={query}
            loading={loading}
            showNewItem={showNewItem}
            onCloseNewItem={() => setShowNewItem(false)}
          />
        )}
        {tab === "sales" && (
          <SalesOrders
            items={items}
            onCreateOrder={addSalesOrder}
            onDeleteOrder={deleteSalesOrder}
            onError={showError}
          />
        )}
        {tab === "reports" && <Reports onError={showError} />}
      </main>
    </div>
  );
}
