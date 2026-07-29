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
  photoUrl?: string;
  description?: string;
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

function resizeImage(file: File, maxDim = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no blob"))), "image/jpeg", quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

export default function FarmerListings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState("");
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

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const resized = await resizeImage(file);
      const fd = new FormData();
      fd.append("file", new File([resized], "crop.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");
      set("photoUrl", data.url);
    } catch {
      setError("Could not upload the photo. Please try a different image.");
    } finally {
      setUploading(false);
    }
  }

  function startEdit(r: Row) {
    setEditingId(r._id);
    setForm({
      title: r.title,
      category: r.category,
      price: String(r.price),
      unit: r.unit,
      stock: String(r.stock),
      emoji: r.emoji || "🥬",
      photoUrl: r.photoUrl || "",
      description: r.description || "",
      certified: r.certified,
      active: r.active,
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setError("");
  }

  async function submit() {
    if (!form.title || !form.price) {
      setError("Title and price are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = editingId
        ? await fetch("/api/listings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, ...form }),
          })
        : await fetch("/api/listings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
      if (!res.ok) throw new Error();
      setForm({ ...EMPTY });
      setEditingId(null);
      await load();
    } catch {
      setError("Could not save. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(r: Row) {
    setBusy(r._id);
    try {
      await fetch("/api/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r._id, active: !r.active }),
      });
      await load();
    } finally {
      setBusy("");
    }
  }

  async function del(r: Row) {
    if (!window.confirm(`Delete "${r.title}" permanently? This cannot be undone.`)) return;
    setBusy(r._id);
    try {
      await fetch(`/api/listings?id=${r._id}`, { method: "DELETE" });
      if (editingId === r._id) cancelEdit();
      await load();
    } finally {
      setBusy("");
    }
  }

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#14472f", margin: 0 }}>Your listings</h1>
      <p style={{ color: "#6b7c71", marginTop: 6, marginBottom: 24 }}>
        Add produce here. Active listings appear on the public Shop page.
      </p>

      <div style={{ ...panel, borderColor: editingId ? "#e0913a" : "#e2e9e1" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>
          {editingId ? "Edit listing" : "Add a listing"}
        </h2>
        <div style={grid2}>
          <Field label="Title *">
            <input style={inp} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Fresh Cucumber" />
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
          <Field label="Emoji (used if no photo)">
            <input style={inp} value={form.emoji} onChange={(e) => set("emoji", e.target.value)} />
          </Field>
          <Field label="Description">
            <input style={inp} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Picked this morning" />
          </Field>
          <Field label="Crop photo">
            <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} style={{ fontSize: 13 }} />
            {uploading && <div style={{ fontSize: 12, color: "#6b7c71", marginTop: 6 }}>Uploading photo…</div>}
            {form.photoUrl && !uploading && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.photoUrl} alt="preview" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e9e1" }} />
                <button onClick={() => set("photoUrl", "")} style={smallGhost}>Remove</button>
              </div>
            )}
          </Field>
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, fontSize: 14 }}>
          <input type="checkbox" checked={form.certified} onChange={(e) => set("certified", e.target.checked)} />
          Show Certified badge
        </label>

        {error && <p style={{ color: "#c4553b", fontSize: 14, marginBottom: 0 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={submit} disabled={saving || uploading} style={{ ...btn, opacity: saving || uploading ? 0.7 : 1 }}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Publish listing"}
          </button>
          {editingId && (
            <button onClick={cancelEdit} style={cancelBtn}>Cancel</button>
          )}
        </div>
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
            <div key={r._id} style={{ ...rowStyle, opacity: r.active ? 1 : 0.6 }}>
              {r.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.photoUrl} alt={r.title} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }} />
              ) : (
                <span style={{ fontSize: 24 }}>{r.emoji}</span>
              )}
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 700 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: "#6b7c71" }}>
                  {r.category} · {r.stock} {r.unit} in stock
                </div>
              </div>
              <div style={{ fontWeight: 800, color: "#14472f" }}>
                MVR {r.price} <span style={{ fontSize: 12, color: "#6b7c71" }}>/{r.unit}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button style={editBtn} onClick={() => startEdit(r)} disabled={busy === r._id}>Edit</button>
                <button style={hideBtn} onClick={() => toggleActive(r)} disabled={busy === r._id}>
                  {r.active ? "Hide" : "Show"}
                </button>
                <button style={deleteBtn} onClick={() => del(r)} disabled={busy === r._id}>Delete</button>
              </div>
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
      <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  );
}

const panel: React.CSSProperties = { background: "#fff", border: "1px solid #e2e9e1", borderRadius: 16, padding: 20, boxShadow: "0 8px 24px rgba(20,38,28,.06)" };
const grid2: React.CSSProperties = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" };
const inp: React.CSSProperties = { width: "100%", padding: "9px 11px", border: "1px solid #c9d6c8", borderRadius: 9, fontSize: 15, background: "#fff", boxSizing: "border-box" };
const btn: React.CSSProperties = { background: "#1f6b4a", color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer" };
const cancelBtn: React.CSSProperties = { background: "#fff", color: "#14261c", border: "1px solid #c9d6c8", borderRadius: 10, padding: "11px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" };
const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e2e9e1", borderRadius: 12, padding: "12px 14px", flexWrap: "wrap" };
const editBtn: React.CSSProperties = { background: "#fff", color: "#1f6b4a", border: "1px solid #c9d6c8", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const hideBtn: React.CSSProperties = { background: "#fff", color: "#b36f1f", border: "1px solid #f0e0c5", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const deleteBtn: React.CSSProperties = { background: "#fff", color: "#c4553b", border: "1px solid #f0d6cd", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const smallGhost: React.CSSProperties = { background: "#fff", color: "#c4553b", border: "1px solid #f0d6cd", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" };
