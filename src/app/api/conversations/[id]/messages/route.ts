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

  const conv = db
    .prepare(
      "SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)"
    )
    .get(id, user.id, user.id) as { id: number } | undefined;

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = db
    .prepare(
      `SELECT m.*, u.name as sender_name, u.profile_photo as sender_photo,
              rm.content as reply_content, ru.name as reply_sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN messages rm ON m.reply_to_id = rm.id
       LEFT JOIN users ru ON rm.sender_id = ru.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`
    )
    .all(id);

  return NextResponse.json({ messages });
}
