export const DEFAULT_ITEMS = [
  { n: "Hanswooly Cotton Cardigan", s: "CD-101", st: 171, ro: 40, e: "🧥" },
  { n: "Cutiepie Rompers", s: "RM-204", st: 45, ro: 50, e: "🧸" },
  { n: "Denim Jacket", s: "DJ-310", st: 12, ro: 30, e: "👖" },
  { n: "Canvas Sneakers", s: "SN-415", st: 88, ro: 25, e: "👟" },
  { n: "Wool Scarf", s: "SC-522", st: 6, ro: 20, e: "🧣" },
  { n: "Rain Poncho", s: "RP-630", st: 0, ro: 15, e: "🧥" },
];

export function statusOf(x) {
  if (x.st <= 0) return { key: "out", label: "Out of stock", color: "var(--red)" };
  if (x.st <= x.ro) return { key: "low", label: "Low stock", color: "#e59a00" };
  return { key: "ok", label: "In stock", color: "var(--green)" };
}
