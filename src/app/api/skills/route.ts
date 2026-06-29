import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const db = getDb();
  const skills = db
    .prepare("SELECT * FROM skills ORDER BY category, name")
    .all();
  return NextResponse.json({ skills });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { name, category, icon } = await req.json();
    if (!name)
      return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const db = getDb();
    const result = db
      .prepare("INSERT INTO skills (name, category, icon) VALUES (?, ?, ?)")
      .run(name, category || "Other", icon || "Terminal");

    return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
