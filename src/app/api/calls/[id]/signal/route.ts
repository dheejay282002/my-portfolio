import { NextResponse } from "next/server";
import { queryAll, queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { type, data } = await req.json();

    if (!type || !data) return NextResponse.json({ error: "type and data required" }, { status: 400 });

    const call = await queryOne(
      "SELECT id FROM calls WHERE id = $1 AND (caller_id = $2 OR callee_id = $3) AND status = 'active'",
      [id, user.id, user.id]
    );
    if (!call) return NextResponse.json({ error: "Call not active" }, { status: 400 });

    await execute(
      "INSERT INTO call_signals (call_id, sender_id, type, data) VALUES ($1, $2, $3, $4)",
      [Number(id), user.id, type, JSON.stringify(data)]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const url = new URL(req.url);
    const since = url.searchParams.get("since");

    const signals = since
      ? await queryAll(
          `SELECT cs.*, u.name as sender_name
           FROM call_signals cs JOIN users u ON cs.sender_id = u.id
           WHERE cs.call_id = $1 AND cs.sender_id != $2 AND cs.id > $3
           ORDER BY cs.id ASC`,
          [Number(id), user.id, Number(since)]
        )
      : await queryAll(
          `SELECT cs.*, u.name as sender_name
           FROM call_signals cs JOIN users u ON cs.sender_id = u.id
           WHERE cs.call_id = $1 AND cs.sender_id != $2
           ORDER BY cs.id ASC`,
          [Number(id), user.id]
        );

    return NextResponse.json({ signals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
