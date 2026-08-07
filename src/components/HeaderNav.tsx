"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang, t } from "@/lib/i18n";

export default function HeaderNav() {
  const [lang, setLang] = useLang();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.customer?.name) setName(d.customer.name); })
      .catch(() => {});
  }, []);

  return (
    <nav className="nav">
      <Link href="/products">{t("shop", lang)}</Link>
      {name ? (
        <Link href="/account" style={pill}>👋 {name.split(" ")[0]}</Link>
      ) : (
        <Link href="/account">{t("account", lang)}</Link>
      )}
      <Link href="/farmer/listings">Listings</Link>
      <Link href="/farmer/orders">Orders</Link>
      <span style={{ display: "inline-flex", gap: 4, marginInlineStart: 6 }}>
        <button onClick={() => setLang("en")} style={langBtn(lang === "en")}>EN</button>
        <button onClick={() => setLang("dv")} style={langBtn(lang === "dv")}>ދިވެހި</button>
      </span>
    </nav>
  );
}

const pill: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  background: "rgba(224,145,58,.22)", color: "#f6c98a", fontWeight: 700,
  padding: "4px 12px", borderRadius: 20, textDecoration: "none",
};

function langBtn(active: boolean): React.CSSProperties {
  return {
    background: active ? "#e0913a" : "transparent",
    color: active ? "#fff" : "#cfe0d4",
    border: active ? "none" : "1px solid rgba(255,255,255,.3)",
    borderRadius: 8, padding: "4px 9px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
  };
}
