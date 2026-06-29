import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const contacts = db
    .prepare(
      "SELECT id, name, email, role, profile_photo FROM users WHERE id != ? ORDER BY name ASC"
    )
    .all(user.id);

  return NextResponse.json({ contacts });
}
