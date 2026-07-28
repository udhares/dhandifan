import { NextRequest, NextResponse } from "next/server";

// Decide which requests must be behind the farmer password.
function needsAuth(req: NextRequest): boolean {
  const { pathname, searchParams } = req.nextUrl;
  const method = req.method;

  // All farmer pages are private.
  if (pathname.startsWith("/farmer")) return true;

  // Orders API: placing an order (POST) is public; listing/updating is private.
  if (pathname === "/api/orders" && method !== "POST") return true;

  // Listings API: the public shop reads active listings (plain GET).
  // Creating a listing (POST) or viewing ALL listings (?all=1) is private.
  if (pathname === "/api/listings") {
    if (method !== "GET") return true;
    if (searchParams.get("all")) return true;
  }

  return false;
}

export function middleware(req: NextRequest) {
  if (!needsAuth(req)) return NextResponse.next();

  const user = process.env.FARMER_USER || "farmer";
  const pass = process.env.FARMER_PASSWORD || "";

  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    const decoded = atob(header.slice(6)); // "user:password"
    const i = decoded.indexOf(":");
    const u = decoded.slice(0, i);
    const p = decoded.slice(i + 1);
    if (pass.length > 0 && u === user && p === pass) {
      return NextResponse.next();
    }
  }

  // Ask the browser to show a username/password prompt.
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Dhandifan Farmer Area"' },
  });
}

export const config = {
  matcher: ["/farmer/:path*", "/api/orders", "/api/listings"],
};
