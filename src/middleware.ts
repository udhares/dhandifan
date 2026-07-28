import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, expectedToken } from "@/lib/auth";

function needsAuth(req: NextRequest): boolean {
  const { pathname, searchParams } = req.nextUrl;
  const method = req.method;

  if (pathname === "/farmer/login") return false;      // the login page itself is open
  if (pathname.startsWith("/api/auth")) return false;  // login/logout endpoints are open

  if (pathname.startsWith("/farmer")) return true;      // all other farmer pages are private
  if (pathname === "/api/orders" && method !== "POST") return true;  // list/update orders is private
  if (pathname === "/api/listings") {
    if (method !== "GET") return true;                  // creating a listing is private
    if (searchParams.get("all")) return true;           // viewing ALL listings is private
  }
  return false;
}

export async function middleware(req: NextRequest) {
  if (!needsAuth(req)) return NextResponse.next();

  const pass = process.env.FARMER_PASSWORD || "";
  const token = req.cookies.get(SESSION_COOKIE)?.value || "";
  const expected = pass ? await expectedToken() : "";

  if (pass && token && token === expected) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/farmer/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/farmer/:path*", "/api/orders", "/api/listings"],
};
