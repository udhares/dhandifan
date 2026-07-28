"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pass }),
      });
      if (!res.ok) {
        setErr("Wrong username or password.");
        return;
      }
      const next = params.get("next") || "/farmer/orders";
      router.push(next);
      router.refresh();
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 40, textAlign: "center" }}>🌴</div>
        <h1 style={{ fontSize: 22, color: "#14472f", textAlign: "center", margin: "6px 0 2px" }}>Dhandifan</h1>
        <p style={{ textAlign: "center", color: "#6b7c71", fontSize: 13, margin: "0 0 18px" }}>Farmer sign in</p>

        <label style={lbl}>Username</label>
        <input style={inp} value={user} onChange={(e) => setUser(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />

        <label style={lbl}>Password</label>
        <input style={inp} type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />

        {err && <p style={{ color: "#c4553b", fontSize: 13, margin: "8px 0 0" }}>{err}</p>}
        <button style={btn} onClick={submit} disabled={busy}>{busy ? "Signing in..." : "Log in"}</button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

const wrap: React.CSSProperties = { display: "grid", placeItems: "center", minHeight: "60vh" };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e9e1", borderRadius: 16, padding: 26, width: "100%", maxWidth: 340, boxShadow: "0 8px 24px rgba(20,38,28,.08)" };
const lbl: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, margin: "10px 0 5px" };
const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #c9d6c8", borderRadius: 9, fontSize: 15, boxSizing: "border-box" };
const btn: React.CSSProperties = { width: "100%", marginTop: 16, background: "#1f6b4a", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontWeight: 700, fontSize: 15, cursor: "pointer" };
