import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";

export const dynamic = "force-dynamic";

async function ensureResumeTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS resume (
      id SERIAL PRIMARY KEY,
      file_url TEXT NOT NULL,
      file_type VARCHAR(50) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

export async function GET() {
  try {
    await ensureResumeTable();
    const resume = await queryOne("SELECT * FROM resume ORDER BY id DESC LIMIT 1");
    return NextResponse.json({ resume: resume || null }, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
