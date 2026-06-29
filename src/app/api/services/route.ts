import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const db = getDb();
  const services = db
    .prepare("SELECT * FROM services ORDER BY created_at DESC")
    .all();
  return NextResponse.json({ services });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { title, description, icon } = await req.json();
    if (!title || !description)
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });

    const db = getDb();
    const result = db
      .prepare("INSERT INTO services (title, description, icon) VALUES (?, ?, ?)")
      .run(title, description, icon || "Code2");

    return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
