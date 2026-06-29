import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { type, data } = await req.json();

  if (!type || !data) return NextResponse.json({ error: "type and data required" }, { status: 400 });

  const db = getDb();

  const call = db
    .prepare("SELECT id FROM calls WHERE id = ? AND (caller_id = ? OR callee_id = ?) AND status = 'active'")
    .get(id, user.id, user.id);
  if (!call) return NextResponse.json({ error: "Call not active" }, { status: 400 });

  db.prepare(
    "INSERT INTO call_signals (call_id, sender_id, type, data) VALUES (?, ?, ?, ?)"
  ).run(Number(id), user.id, type, JSON.stringify(data));

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const url = new URL(req.url);
  const since = url.searchParams.get("since");

  const db = getDb();

  const signals = since
    ? db
        .prepare(
          `SELECT cs.*, u.name as sender_name
           FROM call_signals cs JOIN users u ON cs.sender_id = u.id
           WHERE cs.call_id = ? AND cs.sender_id != ? AND cs.id > ?
           ORDER BY cs.id ASC`
        )
        .all(Number(id), user.id, Number(since))
    : db
        .prepare(
          `SELECT cs.*, u.name as sender_name
           FROM call_signals cs JOIN users u ON cs.sender_id = u.id
           WHERE cs.call_id = ? AND cs.sender_id != ?
           ORDER BY cs.id ASC`
        )
        .all(Number(id), user.id);

  return NextResponse.json({ signals });
}
