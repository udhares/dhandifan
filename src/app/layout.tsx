import type { Metadata } from "next";
import Link from "next/link";
import AccountLink from "@/components/AccountLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dhandifan — Farm to Buyer",
  description:
    "Fresh island produce, direct from the farm. Browse and order fruit, vegetables and herbs.",
  openGraph: {
    title: "Dhandifan — Farm to Buyer",
    description: "Fresh island produce, direct from the farm.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <Link href="/products" className="brand">
            <span className="brand-mark">🌴</span>
            <span className="brand-name">Dhandifan</span>
          </Link>
          <nav className="nav">
            <Link href="/products">Shop</Link>
            <AccountLink />
            <Link href="/farmer/listings">Listings</Link>
            <Link href="/farmer/orders">Orders</Link>
          </nav>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
