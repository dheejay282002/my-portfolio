import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  db.prepare(
    "INSERT OR REPLACE INTO typing_status (conversation_id, user_id, updated_at) VALUES (?, ?, datetime('now'))"
  ).run(Number(id), user.id);

  return NextResponse.json({ success: true });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const typing = db
    .prepare(
      `SELECT u.id, u.name
       FROM typing_status ts
       JOIN users u ON ts.user_id = u.id
       WHERE ts.conversation_id = ?
         AND ts.user_id != ?
         AND ts.updated_at > datetime('now', '-7 seconds')`
    )
    .get(Number(id), user.id) as { id: number; name: string } | undefined;

  return NextResponse.json({ typing: typing || null });
}
