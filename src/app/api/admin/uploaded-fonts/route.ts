import { NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Ensure basic table exists
    await execute(`
      CREATE TABLE IF NOT EXISTS uploaded_fonts (
        id SERIAL PRIMARY KEY,
        font_name VARCHAR(255) NOT NULL UNIQUE,
        font_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    // Try migration for new columns
    try {
      await execute(`ALTER TABLE uploaded_fonts ADD COLUMN IF NOT EXISTS font_weight VARCHAR(20) DEFAULT 'normal'`);
      await execute(`ALTER TABLE uploaded_fonts ADD COLUMN IF NOT EXISTS font_style VARCHAR(20) DEFAULT 'normal'`);
    } catch (_) {}

    // Try full query including style columns; fall back to basic
    let list;
    try {
      list = await queryAll("SELECT font_name, font_url, font_weight, font_style FROM uploaded_fonts ORDER BY created_at DESC");
    } catch (_) {
      list = await queryAll("SELECT font_name, font_url FROM uploaded_fonts ORDER BY created_at DESC");
    }
    return NextResponse.json({ fonts: list });
  } catch (err) {
    console.error("Failed to query uploaded fonts:", err);
    return NextResponse.json({ error: "Failed to fetch uploaded fonts" }, { status: 500 });
  }
}
