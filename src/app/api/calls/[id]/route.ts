import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const call = db
    .prepare("SELECT * FROM calls WHERE id = ? AND (caller_id = ? OR callee_id = ?)")
    .get(id, user.id, user.id) as Record<string, unknown> | undefined;

  if (!call) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ call });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  if (!["accepted", "rejected", "ended", "missed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = getDb();

  const call = db
    .prepare("SELECT * FROM calls WHERE id = ? AND (caller_id = ? OR callee_id = ?)")
    .get(id, user.id, user.id) as Record<string, unknown> | undefined;

  if (!call) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dbStatus = status === "accepted" ? "active" : status;

  db.prepare(
    "UPDATE calls SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(dbStatus, Number(id));

  return NextResponse.json({ success: true });
}
