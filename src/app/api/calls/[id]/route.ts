import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureCallTables } from "@/lib/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureCallTables();
    const { id } = await params;

    const call = await queryOne(
      "SELECT * FROM calls WHERE id = $1 AND (caller_id = $2 OR callee_id = $3)",
      [id, user.id, user.id]
    ) as Record<string, any> | null;

    if (!call) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ call });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureCallTables();
    const { id } = await params;
    const { status } = await req.json();

    if (!["accepted", "rejected", "ended", "missed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const call = await queryOne(
      "SELECT * FROM calls WHERE id = $1 AND (caller_id = $2 OR callee_id = $3)",
      [id, user.id, user.id]
    ) as Record<string, any> | null;

    if (!call) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const dbStatus = status === "accepted" ? "active" : status;

    await execute(
      "UPDATE calls SET status = $1, updated_at = NOW() WHERE id = $2",
      [dbStatus, Number(id)]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
