"use client";

import { usePathname, useRouter } from "next/navigation";

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/farmer/login") return <>{children}</>;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/farmer/login");
    router.refresh();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <button onClick={logout} style={logoutBtn}>Log out</button>
      </div>
      {children}
    </div>
  );
}

const logoutBtn: React.CSSProperties = { background: "#fff", color: "#c4553b", border: "1px solid #f0d6cd", borderRadius: 9, padding: "7px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" };
