import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureCallTables } from "@/lib/schema";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureCallTables();
    const { callee_id } = await req.json();
    if (!callee_id) return NextResponse.json({ error: "callee_id required" }, { status: 400 });

    const existing = await queryOne(
      "SELECT id FROM calls WHERE ((caller_id = $1 AND callee_id = $2) OR (caller_id = $3 AND callee_id = $4)) AND status IN ('ringing','active')",
      [user.id, callee_id, callee_id, user.id]
    ) as { id: number } | null;

    if (existing) return NextResponse.json({ error: "Call already active" }, { status: 409 });

    const call = await queryOne(
      "INSERT INTO calls (caller_id, callee_id) VALUES ($1, $2) RETURNING *",
      [user.id, callee_id]
    );

    return NextResponse.json({ call }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
