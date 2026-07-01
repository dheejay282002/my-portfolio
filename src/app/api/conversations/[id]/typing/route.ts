import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureChatTables } from "@/lib/schema";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureChatTables();
    const { id } = await params;

    await execute(`
      INSERT INTO typing_status (conversation_id, user_id, updated_at) 
      VALUES ($1, $2, NOW())
      ON CONFLICT (conversation_id, user_id) DO UPDATE SET updated_at = NOW()
    `, [Number(id), user.id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureChatTables();
    const { id } = await params;

    const typing = await queryOne(
      `SELECT u.id, u.name
       FROM typing_status ts
       JOIN users u ON ts.user_id = u.id
       WHERE ts.conversation_id = $1
         AND ts.user_id != $2
         AND ts.updated_at > NOW() - INTERVAL '7 seconds'`,
      [Number(id), user.id]
    ) as { id: number; name: string } | null;

    return NextResponse.json({ typing: typing || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
