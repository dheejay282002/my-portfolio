import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const db = getDb();
  const users = db
    .prepare("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC")
    .all();
  return NextResponse.json({ users });
}
