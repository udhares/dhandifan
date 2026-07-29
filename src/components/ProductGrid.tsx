"use client";

import { useEffect, useMemo, useState } from "react";

export interface PublicListing {
  _id: string;
  title: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  emoji: string;
  photoUrl?: string;
  description?: string;
  certified?: boolean;
  createdAt?: string;
}

interface Bank { bank: string; name: string; account: string; }
interface Placed { orderId: string; ref: string; total: number; bank: Bank; }

const CATEGORIES = ["All", "Fruit", "Vegetable", "Herb", "Other"];
const DELIVERY = [
  "Dhoni / boat to Malé",
  "Ferry / terminal pickup",
  "Home delivery on the island",
  "I'll arrange my own transport",
];

export default function ProductGrid({ listings }: { listings: PublicListing[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("newest");

  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", delivery: DELIVERY[0], address: "" });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const [done, setDone] = useState<Placed | null>(null);
  const [payRef, setPayRef] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [paidSubmitted, setPaidSubmitted] = useState(false);

  const [me, setMe] = useState<{ name: string; phone: string; points: number; savedAddress: string } | null>(null);

  // If the customer is signed in, greet them and pre-fill their details.
  useEffect(() => {
    fetch("/api/account/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.customer) {
          setMe(data.customer);
          setForm((f) => ({
            ...f,
            name: f.name || data.customer.name,
            phone: f.phone || data.customer.phone,
            address: f.address || data.customer.savedAddress,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const byId = useMemo(() => {
    const m: Record<string, PublicListing> = {};
    listings.forEach((l) => (m[l._id] = l));
    return m;
  }, [listings]);

  const shown = useMemo(() => {
    let out = listings.filter(
      (l) => (cat === "All" || l.category === cat) && l.title.toLowerCase().includes(q.toLowerCase())
    );
    if (sort === "price-low") out = [...out].sort((a, b) => a.price - b.price);
    else if (sort === "price-high") out = [...out].sort((a, b) => b.price - a.price);
    return out;
  }, [listings, q, cat, sort]);

  const cartEntries = Object.entries(cart).filter(([, n]) => n > 0);
  const itemCount = cartEntries.reduce((s, [, n]) => s + n, 0);
  const cartTotal = cartEntries.reduce((s, [id, n]) => s + (byId[id] ? byId[id].price * n : 0), 0);

  function setQty(id: string, delta: number) {
    setCart((c) => {
      const l = byId[id];
      const max = l ? l.stock : 0;
      let next = (c[id] || 0) + delta;
      if (next < 0) next = 0;
      if (next > max) next = max;
      const copy = { ...c };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  }

  async function placeOrder() {
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }
    if (cartEntries.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setPlacing(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: form.name,
          buyerPhone: form.phone,
          deliveryMethod: form.delivery,
          address: form.address,
          items: cartEntries.map(([id, qty]) => ({ listingId: id, qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");
      setDone({ orderId: data.orderId, ref: data.ref, total: data.total, bank: data.bank });
      setPaidSubmitted(false);
      setPayRef("");
      setCart({});
      setCheckoutOpen(false);
      setForm({ name: "", phone: "", delivery: DELIVERY[0], address: "" });
    } catch {
      setError("Could not place the order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  async function submitPayment() {
    if (!done || !payRef.trim()) return;
    setPayBusy(true);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: done.orderId, paymentRef: payRef }),
      });
      if (res.ok) setPaidSubmitted(true);
    } finally {
      setPayBusy(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search produce..." style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={inputStyle}>
          <option value="newest">Newest</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)} style={{ ...chip, background: cat === c ? "#1f6b4a" : "#fff", color: cat === c ? "#fff" : "#14261c", borderColor: cat === c ? "#1f6b4a" : "#c9d6c8" }}>
            {c}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p style={{ color: "#6b7c71" }}>No produce matches your search.</p>
      ) : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {shown.map((l) => {
            const soldOut = l.stock <= 0;
            const inCart = cart[l._id] || 0;
            return (
              <div key={l._id} style={card}>
                <div style={{ ...media, opacity: soldOut ? 0.55 : 1 }}>
                  {l.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.photoUrl} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 48 }}>{l.emoji}</span>
                  )}
                  {l.certified && <span style={certBadge}>✓ Certified</span>}
                  {soldOut && <span style={soldBadge}>Sold out</span>}
                </div>
                <div style={{ padding: "14px 15px" }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{l.title}</div>
                  <div style={{ color: "#6b7c71", fontSize: 13, minHeight: 18 }}>{l.description}</div>
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 18, color: "#14472f" }}>
                      MVR {l.price.toLocaleString()}
                      <span style={{ fontSize: 12, color: "#6b7c71", fontWeight: 600 }}> /{l.unit}</span>
                    </span>
                    {soldOut ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7c71" }}>Sold out</span>
                    ) : inCart > 0 ? (
                      <span style={qtyBox}>
                        <button style={qtyBtn} onClick={() => setQty(l._id, -1)}>−</button>
                        <span style={{ minWidth: 22, textAlign: "center", fontWeight: 700 }}>{inCart}</span>
                        <button style={qtyBtn} onClick={() => setQty(l._id, 1)}>+</button>
                      </span>
                    ) : (
                      <button style={addBtn} onClick={() => setQty(l._id, 1)}>Add</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {itemCount > 0 && (
        <div style={cartBar}>
          <span style={{ fontWeight: 600 }}>
            {itemCount} item{itemCount > 1 ? "s" : ""} · MVR {cartTotal.toLocaleString()}
          </span>
          <button style={checkoutBtn} onClick={() => { setError(""); setCheckoutOpen(true); }}>Checkout →</button>
        </div>
      )}

      {checkoutOpen && (
        <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) setCheckoutOpen(false); }}>
          <div style={modal}>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, color: "#14472f" }}>Your order</h2>
            {me ? (
              <p style={{ margin: "0 0 14px", color: "#1f6b4a", fontSize: 13, fontWeight: 600 }}>
                Signed in as {me.name} · {me.points} points. You&apos;ll earn ~{Math.floor(cartTotal / 10)} more when delivered.
              </p>
            ) : (
              <p style={{ margin: "0 0 14px", color: "#6b7c71", fontSize: 13 }}>
                No account needed — just your name and phone.{" "}
                <a href="/account" style={{ color: "#1f6b4a", fontWeight: 600 }}>Sign in to earn points →</a>
              </p>
            )}
            <div style={{ marginBottom: 16 }}>
              {cartEntries.map(([id, n]) => {
                const l = byId[id];
                if (!l) return null;
                return (
                  <div key={id} style={orderRow}>
                    <span>{n}× {l.title}</span>
                    <span style={{ fontWeight: 600 }}>MVR {(l.price * n).toLocaleString()}</span>
                  </div>
                );
              })}
              <div style={{ ...orderRow, borderBottom: "none", marginTop: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 17 }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: 17, color: "#14472f" }}>MVR {cartTotal.toLocaleString()}</span>
              </div>
            </div>
            <Field label="Your name *"><input style={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Aminath" /></Field>
            <Field label="Phone number *"><input style={inp} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 777-1234" /></Field>
            <Field label="Delivery method">
              <select style={inp} value={form.delivery} onChange={(e) => setForm({ ...form, delivery: e.target.value })}>
                {DELIVERY.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Delivery address / note"><input style={inp} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Where should it go?" /></Field>
            {error && <p style={{ color: "#c4553b", fontSize: 14, margin: "0 0 10px" }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button style={ghostBtn} onClick={() => setCheckoutOpen(false)}>Back</button>
              <button style={{ ...addBtn, padding: "11px 20px", fontSize: 15, opacity: placing ? 0.7 : 1 }} onClick={placeOrder} disabled={placing}>
                {placing ? "Placing..." : "Place order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {done && (
        <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) setDone(null); }}>
          <div style={modal}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 44 }}>✅</div>
              <h2 style={{ margin: "6px 0 4px", fontSize: 22, color: "#14472f" }}>Order placed!</h2>
              <p style={{ color: "#333", margin: 0 }}>
                Reference <b>#{done.ref}</b> · Total <b>MVR {done.total.toLocaleString()}</b>
              </p>
            </div>

            {paidSubmitted ? (
              <div style={{ ...payBox, textAlign: "center" }}>
                <div style={{ fontSize: 30 }}>🎉</div>
                <p style={{ margin: "6px 0 0", fontWeight: 600 }}>Thank you! Payment reference received.</p>
                <p style={{ margin: "4px 0 0", color: "#6b7c71", fontSize: 13 }}>
                  The farm will verify it and confirm your order.
                </p>
              </div>
            ) : (
              <div style={payBox}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Pay by bank transfer</div>
                {done.bank.account ? (
                  <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                    <div><b>{done.bank.bank}</b></div>
                    {done.bank.name && <div>Account name: <b>{done.bank.name}</b></div>}
                    <div>Account no: <b>{done.bank.account}</b></div>
                    <div>Amount: <b>MVR {done.total.toLocaleString()}</b></div>
                    <div style={{ color: "#6b7c71", marginTop: 4 }}>Please use reference <b>#{done.ref}</b> in your transfer.</div>
                  </div>
                ) : (
                  <p style={{ fontSize: 14, color: "#6b7c71", margin: 0 }}>
                    The farm will contact you on your phone with the bank details for payment.
                  </p>
                )}
                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                    Your transfer reference (after you pay)
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input style={{ ...inp, flex: 1 }} value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="e.g. slip / reference no." />
                    <button style={{ ...addBtn, padding: "9px 14px", opacity: payBusy || !payRef.trim() ? 0.6 : 1 }} onClick={submitPayment} disabled={payBusy || !payRef.trim()}>
                      {payBusy ? "..." : "I've paid"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button style={ghostBtn} onClick={() => setDone(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = { padding: "10px 12px", border: "1px solid #c9d6c8", borderRadius: 10, fontSize: 15, background: "#fff" };
const chip: React.CSSProperties = { padding: "7px 14px", borderRadius: 20, border: "1px solid", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e9e1", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 24px rgba(20,38,28,.06)" };
const media: React.CSSProperties = { height: 120, background: "#e6f0e8", display: "grid", placeItems: "center", position: "relative" };
const certBadge: React.CSSProperties = { position: "absolute", top: 10, right: 10, background: "#1f6b4a", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20 };
const soldBadge: React.CSSProperties = { position: "absolute", top: 10, left: 10, background: "rgba(20,38,28,.8)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20 };
const addBtn: React.CSSProperties = { background: "#1f6b4a", color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { background: "#fff", color: "#14261c", border: "1px solid #c9d6c8", borderRadius: 9, padding: "10px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" };
const qtyBox: React.CSSProperties = { display: "inline-flex", alignItems: "center", border: "1px solid #c9d6c8", borderRadius: 9, overflow: "hidden" };
const qtyBtn: React.CSSProperties = { width: 30, height: 30, border: "none", background: "#fff", color: "#1f6b4a", fontSize: 16, cursor: "pointer" };
const cartBar: React.CSSProperties = { position: "fixed", left: "50%", bottom: 20, transform: "translateX(-50%)", background: "#14472f", color: "#fff", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 12px 40px rgba(20,38,28,.28)", zIndex: 40 };
const checkoutBtn: React.CSSProperties = { background: "#e0913a", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(20,38,28,.45)", display: "grid", placeItems: "center", padding: 18, zIndex: 50 };
const modal: React.CSSProperties = { background: "#fff", borderRadius: 18, padding: 22, width: "100%", maxWidth: 460, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(20,38,28,.3)" };
const orderRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e2e9e1", fontSize: 14 };
const inp: React.CSSProperties = { width: "100%", padding: "9px 11px", border: "1px solid #c9d6c8", borderRadius: 9, fontSize: 15, background: "#fff", boxSizing: "border-box" };
const payBox: React.CSSProperties = { marginTop: 16, background: "#f3f6f1", border: "1px solid #e2e9e1", borderRadius: 12, padding: 16 };
