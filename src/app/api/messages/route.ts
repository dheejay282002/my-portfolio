import { NextResponse } from "next/server";
import { queryAll, queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const messages = await queryAll(
      `SELECT m.*, u.name as sender_name, u.profile_photo as sender_photo,
              rm.content as reply_content, ru.name as reply_sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN messages rm ON m.reply_to_id = rm.id
       LEFT JOIN users ru ON rm.sender_id = ru.id
       WHERE m.conversation_id IN (
         SELECT id FROM conversations WHERE user1_id = $1 OR user2_id = $2
       )
       ORDER BY m.created_at DESC
       LIMIT 50`,
      [user.id, user.id]
    );

    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { receiver_id, content, attachment_url, attachment_type, reply_to_id } = await req.json();
    if (!receiver_id || (!content && !attachment_url))
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    if (user.role === "client") {
      const receiver = await queryOne("SELECT role FROM users WHERE id = $1", [receiver_id]);
      if (!receiver || receiver.role !== "admin") {
        return NextResponse.json({ error: "Clients can only chat with the admin" }, { status: 403 });
      }
    }

    let conv = await queryOne(
      `SELECT id FROM conversations
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $3 AND user2_id = $4)`,
      [user.id, receiver_id, receiver_id, user.id]
    ) as { id: number } | null;

    if (!conv) {
      conv = await queryOne(
        "INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) RETURNING id",
        [user.id, receiver_id]
      ) as { id: number };
    }

    const displayContent = content || (attachment_type?.startsWith("image") ? "📷 Photo" : attachment_type?.startsWith("video") ? "🎬 Video" : "");

    await execute(
      "INSERT INTO messages (conversation_id, sender_id, content, attachment_url, attachment_type, reply_to_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [conv.id, user.id, content || "", attachment_url || "", attachment_type || "", reply_to_id || null]
    );

    await execute(
      "UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2",
      [displayContent, conv.id]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
