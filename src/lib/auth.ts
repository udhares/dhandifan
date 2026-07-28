export const SESSION_COOKIE = "dhandifan_session";

// A session token derived from the farmer credentials (never stores the raw password).
export async function expectedToken(): Promise<string> {
  const user = process.env.FARMER_USER || "farmer";
  const pass = process.env.FARMER_PASSWORD || "";
  const data = new TextEncoder().encode(`${user}:${pass}:dhandifan-v1`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
