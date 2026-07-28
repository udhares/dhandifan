"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OrderItem { title: string; qty: number; price: number; }
interface OrderRow {
  _id: string;
  buyerName: string;
  buyerPhone: string;
  items: OrderItem[];
  status: string;
  deliveryMethod: string;
  note: string;
  paymentStatus: string;
  paymentRef: string;
  createdAt: string;
}

const LABEL: Record<string, string> = {
  new: "New", confirmed: "Confirmed", packed: "Packed",
  out: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled",
};
const COLORS: Record<string, { bg: string; fg: string }> = {
  new: { bg: "#f7e1da", fg: "#c4553b" },
  confirmed: { bg: "#fbebd5", fg: "#b36f1f" },
  packed: { bg: "#eae4f2", fg: "#6a4fa3" },
  out: { bg: "#ddeff0", fg: "#0a6570" },
  delivered: { bg: "#e6f0e8", fg: "#1f6b4a" },
  cancelled: { bg: "#eeeeee", fg: "#888888" },
};
const PAY_LABEL: Record<string, string> = { unpaid: "Unpaid", submitted: "Payment submitted", paid: "Paid ✓" };
const PAY_COLORS: Record<string, { bg: string; fg: string }> = {
  unpaid: { bg: "#eeeeee", fg: "#888888" },
  submitted: { bg: "#fbebd5", fg: "#b36f1f" },
  paid: { bg: "#e6f0e8", fg: "#1f6b4a" },
};
const NEXT: Record<string, { label: string; to: string }[]> = {
  new: [{ label: "Confirm", to: "confirmed" }, { label: "Decline", to: "cancelled" }],
  confirmed: [{ label: "Mark packed", to: "packed" }],
  packed: [{ label: "Out for delivery", to: "out" }],
  out: [{ label: "Mark delivered", to: "delivered" }],
  delivered: [],
  cancelled: [],
};

export default function FarmerOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      setOrders(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function patch(id: string, payload: Record<string, string>) {
    setBusy(id);
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      await load();
    } finally {
      setBusy("");
    }
  }

  const total = (o: OrderRow) => o.items.reduce((s, i) => s + i.price * i.qty, 0);
  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const past = orders.filter((o) => o.status === "delivered" || o.status === "cancelled");

  function card(o: OrderRow) {
    const c = COLORS[o.status] || COLORS.new;
    const pc = PAY_COLORS[o.paymentStatus] || PAY_COLORS.unpaid;
    const acts = NEXT[o.status] || [];
    return (
      <div key={o._id} style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{o.buyerName}</div>
            <div style={{ fontSize: 13, color: "#6b7c71" }}>{o.buyerPhone} · #{o._id.slice(-6).toUpperCase()}</div>
          </div>
          <span style={{ background: c.bg, color: c.fg, fontWeight: 700, fontSize: 12, padding: "4px 10px", borderRadius: 20 }}>
            {LABEL[o.status] || o.status}
          </span>
        </div>

        <div style={{ margin: "10px 0", fontSize: 14 }}>
          {o.items.map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span>{it.qty}× {it.title}</span>
              <span style={{ color: "#6b7c71" }}>MVR {(it.price * it.qty).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 0", fontWeight: 800, color: "#14472f" }}>
            <span>Total</span>
            <span>MVR {total(o).toLocaleString()}</span>
          </div>
        </div>

        {(o.deliveryMethod || o.note) && (
          <div style={{ fontSize: 12.5, color: "#6b7c71", marginBottom: 10 }}>
            {o.deliveryMethod}{o.note ? ` · ${o.note}` : ""}
          </div>
        )}

        {/* payment row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <span style={{ background: pc.bg, color: pc.fg, fontWeight: 700, fontSize: 12, padding: "4px 10px", borderRadius: 20 }}>
            {PAY_LABEL[o.paymentStatus] || "Unpaid"}
          </span>
          {o.paymentRef && <span style={{ fontSize: 12.5, color: "#6b7c71" }}>Ref: {o.paymentRef}</span>}
          {o.paymentStatus !== "paid" && (
            <button style={payBtn} disabled={busy === o._id} onClick={() => patch(o._id, { paymentStatus: "paid" })}>
              Mark as paid
            </button>
          )}
          {o.paymentStatus === "paid" && (
            <button style={ghostBtn} disabled={busy === o._id} onClick={() => patch(o._id, { paymentStatus: "unpaid" })}>
              Mark unpaid
            </button>
          )}
        </div>

        {acts.length > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            {acts.map((a) => (
              <button key={a.to} disabled={busy === o._id} onClick={() => patch(o._id, { status: a.to })} style={a.to === "cancelled" ? ghostBtn : primaryBtn}>
                {busy === o._id ? "..." : a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#14472f", margin: 0 }}>Orders</h1>
        <Link href="/farmer/listings" style={{ marginLeft: "auto", color: "#1f6b4a", fontWeight: 600, fontSize: 14 }}>Manage listings →</Link>
      </div>
      <p style={{ color: "#6b7c71", marginTop: 0, marginBottom: 18 }}>
        Incoming orders. Confirm them, mark payment, and move them through to delivery.
      </p>
      <button onClick={load} style={{ ...ghostBtn, marginBottom: 20 }}>↻ Refresh</button>

      {loading ? (
        <p style={{ color: "#6b7c71" }}>Loading...</p>
      ) : orders.length === 0 ? (
        <p style={{ color: "#6b7c71" }}>No orders yet. When customers order from the shop, they appear here.</p>
      ) : (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>Active {active.length ? `(${active.length})` : ""}</h2>
          {active.length === 0 ? <p style={{ color: "#6b7c71" }}>No active orders right now.</p> : <div style={grid}>{active.map(card)}</div>}
          {past.length > 0 && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 26 }}>Completed / Cancelled ({past.length})</h2>
              <div style={grid}>{past.map(card)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const grid: React.CSSProperties = { display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" };
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e2e9e1", borderRadius: 14, padding: 16, boxShadow: "0 8px 24px rgba(20,38,28,.06)" };
const primaryBtn: React.CSSProperties = { background: "#1f6b4a", color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { background: "#fff", color: "#14261c", border: "1px solid #c9d6c8", borderRadius: 9, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const payBtn: React.CSSProperties = { background: "#e0913a", color: "#fff", border: "none", borderRadius: 9, padding: "7px 13px", fontWeight: 700, fontSize: 13, cursor: "pointer" };
