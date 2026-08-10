import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

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

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await ensureResumeTable();
    const { file_url, file_type, file_name } = await req.json();
    if (!file_url || !file_type || !file_name)
      return NextResponse.json({ error: "file_url, file_type, and file_name are required" }, { status: 400 });

    const existing = await queryOne("SELECT id FROM resume LIMIT 1");
    if (existing) {
      await execute("UPDATE resume SET file_url = $1, file_type = $2, file_name = $3, updated_at = NOW() WHERE id = $4", [file_url, file_type, file_name, existing.id]);
    } else {
      await execute("INSERT INTO resume (file_url, file_type, file_name) VALUES ($1, $2, $3)", [file_url, file_type, file_name]);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await ensureResumeTable();
    await execute("DELETE FROM resume");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
