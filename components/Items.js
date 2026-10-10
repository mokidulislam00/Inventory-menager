import { useEffect, useState } from "react";
import { statusOf } from "../lib";

export default function Items({ items, onAdd, onUpdatePrice, onDelete, query, loading, showNewItem, onCloseNewItem }) {
  const [form, setForm] = useState({ n: "", s: "", price: "", st: "", ro: "" });
  const [saving, setSaving] = useState(false);
  const [prices, setPrices] = useState({});
  const [savingPrice, setSavingPrice] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    setPrices((current) => {
      const next = { ...current };
      for (const item of items) {
        if (!(item._id in next)) next[item._id] = String(item.price ?? 0);
      }
      return next;
    });
  }, [items]);

  useEffect(() => {
    if (showNewItem) document.getElementById("n")?.focus();
  }, [showNewItem]);

  async function save() {
    const name = form.n.trim();
    if (!name) return document.getElementById("n")?.focus();
    setSaving(true);
    const saved = await onAdd({
      n: name,
      s: form.s.trim() || `NEW-${items.length + 1}`,
      price: Number(form.price) || 0,
      st: Number(form.st) || 0,
      ro: Number(form.ro) || 0,
    });
    if (saved) {
      setForm({ n: "", s: "", price: "", st: "", ro: "" });
      onCloseNewItem();
    }
    setSaving(false);
  }

  async function savePrice(item) {
    const price = Number(prices[item._id]);
    if (!Number.isFinite(price) || price < 0) return;
    setSavingPrice(item._id);
    const saved = await onUpdatePrice(item._id, price);
    if (saved) {
      setPrices((current) => ({ ...current, [item._id]: String(Math.round(price * 100) / 100) }));
    }
    setSavingPrice("");
  }

  const q = query.toLowerCase();
  const rows = items
    .map((x, i) => ({ x, i }))
    .filter(({ x }) => (x.n + x.s).toLowerCase().includes(q));

  return (
    <div className="grid">
      <div className="card wide">
        <h3>ITEMS</h3>
        <div id="new-item-form" className="item-create" hidden={!showNewItem}>
          {showNewItem && (
            <div className="form">
              <input id="n" placeholder="Item name" value={form.n} onChange={set("n")} />
              <input placeholder="SKU" value={form.s} onChange={set("s")} />
              <input type="number" min="0" step="0.01" placeholder="Sale price" aria-label="Sale price" value={form.price} onChange={set("price")} />
              <input type="number" min="0" placeholder="Stock" value={form.st} onChange={set("st")} />
              <input type="number" min="0" placeholder="Reorder level" value={form.ro} onChange={set("ro")} />
              <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save item"}</button>
            </div>
          )}
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr><th>Name</th><th>SKU</th><th>Sale price</th><th>Stock</th><th>Reorder at</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7}>Loading items…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7}>No items match. Clear the search or add a new item.</td></tr>
              )}
              {rows.map(({ x }) => {
                const s = statusOf(x);
                const w = Math.min(100, Math.round((x.st / Math.max(x.ro * 2, 1)) * 100));
                return (
                  <tr key={x._id}>
                    <td>{x.n}</td>
                    <td>{x.s}</td>
                    <td>
                      <input
                        className="price-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={prices[x._id] ?? String(x.price ?? 0)}
                        onChange={(event) => setPrices((current) => ({ ...current, [x._id]: event.target.value }))}
                        aria-label={`Sale price for ${x.n}`}
                      />
                    </td>
                    <td>{x.st}</td>
                    <td>{x.ro}</td>
                    <td>
                      <span className={`pill ${s.key}`}>{s.label}</span>
                      <div className="bar"><i style={{ width: `${w}%`, background: s.color }} /></div>
                    </td>
                    <td>
                      <button
                        className="btn ghost"
                        onClick={() => savePrice(x)}
                        disabled={savingPrice === x._id || Number(prices[x._id]) === Number(x.price ?? 0)}
                      >
                        {savingPrice === x._id ? "Saving…" : "Save price"}
                      </button>
                      <button className="btn ghost" onClick={() => onDelete(x._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
