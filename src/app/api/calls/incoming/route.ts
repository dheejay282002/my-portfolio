import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureCallTables } from "@/lib/schema";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureCallTables();
    const call = await queryOne(
      `SELECT c.*, u.name as caller_name, u.profile_photo as caller_photo
       FROM calls c JOIN users u ON c.caller_id = u.id
       WHERE c.callee_id = $1 AND c.status = 'ringing'
       ORDER BY c.created_at DESC LIMIT 1`,
      [user.id]
    );

    return NextResponse.json({ call: call || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
