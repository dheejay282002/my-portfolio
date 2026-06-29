import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const conversations = db
    .prepare(
      `SELECT c.*,
              u1.id as u1_id, u1.name as u1_name, u1.profile_photo as u1_photo,
              u2.id as u2_id, u2.name as u2_name, u2.profile_photo as u2_photo
       FROM conversations c
       JOIN users u1 ON c.user1_id = u1.id
       JOIN users u2 ON c.user2_id = u2.id
       WHERE c.user1_id = ? OR c.user2_id = ?
       ORDER BY c.last_message_at DESC`
    )
    .all(user.id, user.id) as Array<Record<string, unknown>>;

  const result = conversations.map((c) => {
    const isUser1 = c.user1_id === user.id;
    const other = isUser1
      ? { id: c.u2_id, name: c.u2_name, photo: c.u2_photo }
      : { id: c.u1_id, name: c.u1_name, photo: c.u1_photo };
    return {
      id: c.id,
      other_user: other,
      last_message: c.last_message,
      last_message_at: c.last_message_at,
    };
  });

  return NextResponse.json({ conversations: result });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { receiver_id } = await req.json();
    if (!receiver_id)
      return NextResponse.json({ error: "receiver_id is required" }, { status: 400 });

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

    const full = db
      .prepare(
        `SELECT c.*,
                u1.id as u1_id, u1.name as u1_name, u1.profile_photo as u1_photo,
                u2.id as u2_id, u2.name as u2_name, u2.profile_photo as u2_photo
         FROM conversations c
         JOIN users u1 ON c.user1_id = u1.id
         JOIN users u2 ON c.user2_id = u2.id
         WHERE c.id = ?`
      )
      .get(conv.id) as Record<string, unknown>;

    const isUser1 = full.user1_id === user.id;
    const other = isUser1
      ? { id: full.u2_id, name: full.u2_name, photo: full.u2_photo }
      : { id: full.u1_id, name: full.u1_name, photo: full.u1_photo };

    return NextResponse.json({
      conversation: {
        id: full.id,
        other_user: other,
        last_message: full.last_message,
        last_message_at: full.last_message_at,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
