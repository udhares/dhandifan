"use client";

import { useEffect, useState } from "react";

interface Row {
  _id: string;
  title: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  emoji: string;
  active: boolean;
  certified: boolean;
}

const EMPTY = {
  title: "",
  category: "Vegetable",
  price: "",
  unit: "kg",
  stock: "",
  emoji: "🥬",
  photoUrl: "",
  description: "",
  certified: true,
  active: true,
};

export default function FarmerListings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/listings?all=1");
      setRows(await res.json());
    } catch {
      setError("Could not load listings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    if (!form.title || !form.price) {
      setError("Title and price are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setForm({ ...EMPTY });
      await load();
    } catch {
      setError("Could not save. Check your database connection.");
    } finally {
      setSaving(false);
    }
  }

  const set = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#14472f", margin: 0 }}>
        Your listings
      </h1>
      <p style={{ color: "#6b7c71", marginTop: 6, marginBottom: 24 }}>
        Add produce here. Active listings appear on the public Shop page.
      </p>

      <div style={panel}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>Add a listing</h2>
        <div style={grid2}>
          <Field label="Title *">
            <input style={inp} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Fresh Cucumber" />
          </Field>
          <Field label="Emoji">
            <input style={inp} value={form.emoji} onChange={(e) => set("emoji", e.target.value)} />
          </Field>
          <Field label="Category">
            <select style={inp} value={form.category} onChange={(e) => set("category", e.target.value)}>
              <option>Fruit</option>
              <option>Vegetable</option>
              <option>Herb</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Unit">
            <select style={inp} value={form.unit} onChange={(e) => set("unit", e.target.value)}>
              <option>kg</option>
              <option>bunch</option>
              <option>bundle</option>
              <option>piece</option>
            </select>
          </Field>
          <Field label="Price (MVR) *">
            <input style={inp} type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="22" />
          </Field>
          <Field label="Stock">
            <input style={inp} type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="100" />
          </Field>
          <Field label="Photo URL (optional)">
            <input style={inp} value={form.photoUrl} onChange={(e) => set("photoUrl", e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Description">
            <input style={inp} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Picked this morning" />
          </Field>
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, fontSize: 14 }}>
          <input type="checkbox" checked={form.certified} onChange={(e) => set("certified", e.target.checked)} />
          Show Certified badge
        </label>

        {error && <p style={{ color: "#c4553b", fontSize: 14, marginBottom: 0 }}>{error}</p>}

        <button onClick={submit} disabled={saving} style={{ ...btn, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "Publish listing"}
        </button>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 30 }}>
        Current listings {loading ? "" : `(${rows.length})`}
      </h2>

      {loading ? (
        <p style={{ color: "#6b7c71" }}>Loading...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "#6b7c71" }}>No listings yet. Add your first one above.</p>
      ) : (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {rows.map((r) => (
            <div key={r._id} style={rowStyle}>
              <span style={{ fontSize: 24 }}>{r.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: "#6b7c71" }}>
                  {r.category} · {r.stock} {r.unit} in stock
                </div>
              </div>
              <div style={{ fontWeight: 800, color: "#14472f" }}>
                MVR {r.price} <span style={{ fontSize: 12, color: "#6b7c71" }}>/{r.unit}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: r.active ? "#1f6b4a" : "#6b7c71" }}>
                {r.active ? "Active" : "Hidden"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const panel: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e9e1",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 8px 24px rgba(20,38,28,.06)",
};
const grid2: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
};
const inp: React.CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  border: "1px solid #c9d6c8",
  borderRadius: 9,
  fontSize: 15,
  background: "#fff",
};
const btn: React.CSSProperties = {
  marginTop: 16,
  background: "#1f6b4a",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "11px 18px",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};
const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "#fff",
  border: "1px solid #e2e9e1",
  borderRadius: 12,
  padding: "12px 14px",
};
