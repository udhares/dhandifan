import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

// POST /api/upload -> store an uploaded image in Vercel Blob, return its URL.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const name = `crops/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const blob = await put(name, file, { access: "public", contentType: "image/jpeg" });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  }
}
