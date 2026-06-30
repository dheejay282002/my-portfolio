import { NextResponse } from "next/server";
import { queryAll, queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let query = `SELECT c.*,
                        u1.id as u1_id, u1.name as u1_name, u1.profile_photo as u1_photo,
                        u2.id as u2_id, u2.name as u2_name, u2.profile_photo as u2_photo
                 FROM conversations c
                 JOIN users u1 ON c.user1_id = u1.id
                 JOIN users u2 ON c.user2_id = u2.id
                 WHERE (c.user1_id = $1 OR c.user2_id = $2)`;
    const params: any[] = [user.id, user.id];

    if (user.role === "client") {
      query += ` AND (u1.role = 'admin' OR u2.role = 'admin')`;
    }

    query += ` ORDER BY c.last_message_at DESC`;

    const conversations = await queryAll(query, params) as Array<Record<string, any>>;

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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { receiver_id } = await req.json();
    if (!receiver_id)
      return NextResponse.json({ error: "receiver_id is required" }, { status: 400 });

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

    const full = await queryOne(
      `SELECT c.*,
              u1.id as u1_id, u1.name as u1_name, u1.profile_photo as u1_photo,
              u2.id as u2_id, u2.name as u2_name, u2.profile_photo as u2_photo
       FROM conversations c
       JOIN users u1 ON c.user1_id = u1.id
       JOIN users u2 ON c.user2_id = u2.id
       WHERE c.id = $1`,
      [conv.id]
    ) as Record<string, any>;

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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
