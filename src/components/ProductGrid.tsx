"use client";

import { useMemo, useState } from "react";

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

const CATEGORIES = ["All", "Fruit", "Vegetable", "Herb", "Other"];

export default function ProductGrid({ listings }: { listings: PublicListing[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("newest");

  const shown = useMemo(() => {
    let out = listings.filter((l) => {
      const matchCat = cat === "All" || l.category === cat;
      const matchQ = l.title.toLowerCase().includes(q.toLowerCase());
      return matchCat && matchQ;
    });
    if (sort === "price-low") out = [...out].sort((a, b) => a.price - b.price);
    else if (sort === "price-high") out = [...out].sort((a, b) => b.price - a.price);
    return out;
  }, [listings, q, cat, sort]);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search produce..."
          style={{ ...inputStyle, flex: 1, minWidth: 180 }}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={inputStyle}>
          <option value="newest">Newest</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              ...chip,
              background: cat === c ? "#1f6b4a" : "#fff",
              color: cat === c ? "#fff" : "#14261c",
              borderColor: cat === c ? "#1f6b4a" : "#c9d6c8",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p style={{ color: "#6b7c71" }}>No produce matches your search.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {shown.map((l) => (
            <ProductCard key={l._id} l={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ l }: { l: PublicListing }) {
  const soldOut = l.stock <= 0;
  return (
    <div style={card}>
      <div style={{ ...media, opacity: soldOut ? 0.55 : 1 }}>
        {l.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={l.photoUrl}
            alt={l.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 48 }}>{l.emoji}</span>
        )}
        {l.certified && <span style={certBadge}>✓ Certified</span>}
        {soldOut && <span style={soldBadge}>Sold out</span>}
      </div>
      <div style={{ padding: "14px 15px" }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{l.title}</div>
        <div style={{ color: "#6b7c71", fontSize: 13, minHeight: 18 }}>{l.description}</div>
        <div style={{ marginTop: 10, fontWeight: 800, fontSize: 18, color: "#14472f" }}>
          MVR {l.price.toLocaleString()}
          <span style={{ fontSize: 12, color: "#6b7c71", fontWeight: 600 }}> /{l.unit}</span>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #c9d6c8",
  borderRadius: 10,
  fontSize: 15,
  background: "#fff",
};
const chip: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 20,
  border: "1px solid",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};
const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e9e1",
  borderRadius: 16,
  overflow: "hidden",
  boxShadow: "0 8px 24px rgba(20,38,28,.06)",
};
const media: React.CSSProperties = {
  height: 120,
  background: "#e6f0e8",
  display: "grid",
  placeItems: "center",
  position: "relative",
};
const certBadge: React.CSSProperties = {
  position: "absolute",
  top: 10,
  right: 10,
  background: "#1f6b4a",
  color: "#fff",
  fontSize: 11,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 20,
};
const soldBadge: React.CSSProperties = {
  position: "absolute",
  top: 10,
  left: 10,
  background: "rgba(20,38,28,.8)",
  color: "#fff",
  fontSize: 11,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 20,
};
