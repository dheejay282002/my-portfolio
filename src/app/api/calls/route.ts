import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { callee_id } = await req.json();
  if (!callee_id) return NextResponse.json({ error: "callee_id required" }, { status: 400 });

  const db = getDb();

  const existing = db
    .prepare("SELECT id FROM calls WHERE ((caller_id = ? AND callee_id = ?) OR (caller_id = ? AND callee_id = ?)) AND status IN ('ringing','active')")
    .get(user.id, callee_id, callee_id, user.id) as { id: number } | undefined;
  if (existing) return NextResponse.json({ error: "Call already active" }, { status: 409 });

  const result = db
    .prepare("INSERT INTO calls (caller_id, callee_id) VALUES (?, ?)")
    .run(user.id, callee_id);

  const call = db
    .prepare("SELECT * FROM calls WHERE id = ?")
    .get(Number(result.lastInsertRowid));

  return NextResponse.json({ call }, { status: 201 });
}
