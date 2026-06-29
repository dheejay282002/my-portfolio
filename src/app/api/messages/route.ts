import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const messages = db
    .prepare(
      `SELECT m.*, u.name as sender_name, u.profile_photo as sender_photo,
              rm.content as reply_content, ru.name as reply_sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN messages rm ON m.reply_to_id = rm.id
       LEFT JOIN users ru ON rm.sender_id = ru.id
       WHERE m.conversation_id IN (
         SELECT id FROM conversations WHERE user1_id = ? OR user2_id = ?
       )
       ORDER BY m.created_at DESC
       LIMIT 50`
    )
    .all(user.id, user.id);

  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { receiver_id, content, attachment_url, attachment_type, reply_to_id } = await req.json();
    if (!receiver_id || (!content && !attachment_url))
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const db = getDb();

    let conv = db
      .prepare(
        `SELECT id FROM conversations
         WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`
      )
      .get(user.id, receiver_id, receiver_id, user.id) as { id: number } | undefined;

    if (!conv) {
      const result = db
        .prepare("INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)")
        .run(user.id, receiver_id);
      conv = { id: Number(result.lastInsertRowid) };
    }

    const displayContent = content || (attachment_type?.startsWith("image") ? "📷 Photo" : attachment_type?.startsWith("video") ? "🎬 Video" : "");

    db.prepare(
      "INSERT INTO messages (conversation_id, sender_id, content, attachment_url, attachment_type, reply_to_id) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(conv.id, user.id, content || "", attachment_url || "", attachment_type || "", reply_to_id || null);

    db.prepare(
      "UPDATE conversations SET last_message = ?, last_message_at = datetime('now') WHERE id = ?"
    ).run(displayContent, conv.id);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
