"use client";

import { useEffect, useState } from "react";

interface OrderRow {
  _id: string;
  items: { title: string; qty: number; price: number }[];
  status: string;
  createdAt: string;
  pointsAwarded: boolean;
}
interface Me {
  name: string;
  phone: string;
  points: number;
  savedAddress: string;
}

const STATUS_LABEL: Record<string, string> = {
  new: "New", confirmed: "Confirmed", packed: "Packed",
  out: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled",
};

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const [addr, setAddr] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  async function loadMe() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/me");
      if (res.ok) {
        const data = await res.json();
        setMe(data.customer);
        setOrders(data.orders || []);
        setAddr(data.customer.savedAddress || "");
      } else {
        setMe(null);
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadMe(); }, []);

  async function submit() {
    setBusy(true); setErr("");
    try {
      const url = mode === "signup" ? "/api/account/signup" : "/api/account/login";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Something went wrong."); return; }
      setForm({ name: "", phone: "", password: "" });
      await loadMe();
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/account/logout", { method: "POST" });
    setMe(null); setOrders([]);
  }

  async function saveAddress() {
    setSavedMsg("");
    await fetch("/api/account/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedAddress: addr }),
    });
    setSavedMsg("Saved ✓");
    setTimeout(() => setSavedMsg(""), 2000);
  }

  if (loading) return <p style={{ color: "#6b7c71" }}>Loading...</p>;

  // ---- signed in ----
  if (me) {
    return (
      <div style={{ maxWidth: 640 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#14472f", margin: 0 }}>Hi, {me.name}</h1>
          <button onClick={logout} style={logoutBtn}>Log out</button>
        </div>

        <div style={pointsCard}>
          <div style={{ fontSize: 13, opacity: 0.9 }}>Your loyalty points</div>
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1 }}>{me.points}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>Earn 1 point for every MVR 10 spent, added when your order is delivered.</div>
        </div>

        <div style={panel}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Saved delivery address</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inp, flex: 1 }} value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Your usual delivery address" />
            <button style={primaryBtn} onClick={saveAddress}>Save</button>
          </div>
          {savedMsg && <div style={{ color: "#1f6b4a", fontSize: 13, marginTop: 6 }}>{savedMsg}</div>}
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 26 }}>Your orders</h2>
        {orders.length === 0 ? (
          <p style={{ color: "#6b7c71" }}>No orders yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {orders.map((o) => {
              const total = o.items.reduce((s, i) => s + i.price * i.qty, 0);
              return (
                <div key={o._id} style={orderCard}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700 }}>#{o._id.slice(-6).toUpperCase()}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1f6b4a" }}>{STATUS_LABEL[o.status] || o.status}</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: "#6b7c71", margin: "4px 0" }}>
                    {o.items.map((i) => `${i.qty}× ${i.title}`).join(", ")}
                  </div>
                  <div style={{ fontWeight: 800, color: "#14472f" }}>MVR {total.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---- not signed in: login / signup ----
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <div style={authCard}>
        <div style={{ fontSize: 40, textAlign: "center" }}>🌴</div>
        <h1 style={{ fontSize: 22, color: "#14472f", textAlign: "center", margin: "6px 0 2px" }}>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p style={{ textAlign: "center", color: "#6b7c71", fontSize: 13, margin: "0 0 18px" }}>
          {mode === "signup" ? "Earn points and save your details." : "Sign in to your Dhandifan account."}
        </p>

        {mode === "signup" && (
          <Field label="Your name">
            <input style={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
        )}
        <Field label="Phone number">
          <input style={inp} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 777-1234" />
        </Field>
        <Field label="Password">
          <input style={inp} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        </Field>

        {err && <p style={{ color: "#c4553b", fontSize: 13, margin: "6px 0 0" }}>{err}</p>}
        <button style={bigBtn} onClick={submit} disabled={busy}>
          {busy ? "Please wait..." : mode === "signup" ? "Sign up" : "Log in"}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "#6b7c71", marginTop: 14 }}>
          {mode === "signup" ? "Already have an account? " : "New here? "}
          <button
            onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setErr(""); }}
            style={{ background: "none", border: "none", color: "#1f6b4a", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
          >
            {mode === "signup" ? "Log in" : "Create one"}
          </button>
        </p>
      </div>
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

const authCard: React.CSSProperties = { background: "#fff", border: "1px solid #e2e9e1", borderRadius: 16, padding: 26, width: "100%", maxWidth: 360, boxShadow: "0 8px 24px rgba(20,38,28,.08)" };
const pointsCard: React.CSSProperties = { background: "linear-gradient(120deg,#14472f,#1f6b4a)", color: "#fff", borderRadius: 16, padding: "20px 22px", marginTop: 18 };
const panel: React.CSSProperties = { background: "#fff", border: "1px solid #e2e9e1", borderRadius: 14, padding: 18, marginTop: 16 };
const orderCard: React.CSSProperties = { background: "#fff", border: "1px solid #e2e9e1", borderRadius: 12, padding: 14 };
const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #c9d6c8", borderRadius: 9, fontSize: 15, boxSizing: "border-box" };
const bigBtn: React.CSSProperties = { width: "100%", marginTop: 14, background: "#1f6b4a", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontWeight: 700, fontSize: 15, cursor: "pointer" };
const primaryBtn: React.CSSProperties = { background: "#1f6b4a", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const logoutBtn: React.CSSProperties = { marginLeft: "auto", background: "#fff", color: "#c4553b", border: "1px solid #f0d6cd", borderRadius: 9, padding: "7px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" };
