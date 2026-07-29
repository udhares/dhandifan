"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AccountLink() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.customer?.name) setName(d.customer.name); })
      .catch(() => {});
  }, []);

  if (name) {
    return (
      <Link href="/account" style={pill}>
        👋 {name.split(" ")[0]}
      </Link>
    );
  }
  return <Link href="/account">Account</Link>;
}

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "rgba(224,145,58,.22)",
  color: "#f6c98a",
  fontWeight: 700,
  padding: "4px 12px",
  borderRadius: 20,
  textDecoration: "none",
};
