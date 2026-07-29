import { NextRequest } from "next/server";

export const CUSTOMER_COOKIE = "dhandifan_customer";
const secret = () => process.env.SESSION_SECRET || "dhandifan-dev-secret-change-me";

// Coerce a Uint8Array to the BufferSource type the Web Crypto API expects.
const buf = (u: Uint8Array): BufferSource => u as unknown as BufferSource;
const enc = (s: string): BufferSource => new TextEncoder().encode(s) as unknown as BufferSource;

function bytesToHex(b: Uint8Array): string {
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(h: string): Uint8Array {
  const a = new Uint8Array(h.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16);
  return a;
}

export async function hashPassword(password: string, saltHex?: string) {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: buf(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return { salt: bytesToHex(salt), hash: bytesToHex(new Uint8Array(bits)) };
}

export async function verifyPassword(password: string, saltHex: string, hashHex: string) {
  const { hash } = await hashPassword(password, saltHex);
  return hash === hashHex;
}

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc(value));
  return bytesToHex(new Uint8Array(sig));
}

export async function makeSession(customerId: string): Promise<string> {
  return `${customerId}.${await hmac(customerId)}`;
}

export async function readSession(cookieValue: string | undefined): Promise<string | null> {
  if (!cookieValue) return null;
  const i = cookieValue.lastIndexOf(".");
  if (i < 0) return null;
  const id = cookieValue.slice(0, i);
  const sig = cookieValue.slice(i + 1);
  return (await hmac(id)) === sig ? id : null;
}

export async function getCustomerId(req: NextRequest): Promise<string | null> {
  return readSession(req.cookies.get(CUSTOMER_COOKIE)?.value);
}
