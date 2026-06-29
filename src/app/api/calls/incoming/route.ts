import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();

  const call = db
    .prepare(
      `SELECT c.*, u.name as caller_name, u.profile_photo as caller_photo
       FROM calls c JOIN users u ON c.caller_id = u.id
       WHERE c.callee_id = ? AND c.status = 'ringing'
       ORDER BY c.created_at DESC LIMIT 1`
    )
    .get(user.id);

  return NextResponse.json({ call: call || null });
}
