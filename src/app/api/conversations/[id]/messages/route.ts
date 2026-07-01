import { NextResponse } from "next/server";
import { queryAll, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureChatTables } from "@/lib/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureChatTables();
    const { id } = await params;

    const conv = await queryOne(
      "SELECT id FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $3)",
      [id, user.id, user.id]
    ) as { id: number } | null;

    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const messages = await queryAll(
      `SELECT m.*, u.name as sender_name, u.profile_photo as sender_photo,
              rm.content as reply_content, ru.name as reply_sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN messages rm ON m.reply_to_id = rm.id
       LEFT JOIN users ru ON rm.sender_id = ru.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );

    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
