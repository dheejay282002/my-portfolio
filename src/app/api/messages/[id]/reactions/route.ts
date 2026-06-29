import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { emoji } = await req.json();
  if (!emoji) return NextResponse.json({ error: "Emoji required" }, { status: 400 });

  const db = getDb();
  const msg = db.prepare("SELECT reactions FROM messages WHERE id = ?").get(id) as { reactions: string } | undefined;
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let reactions: Record<string, number[]> = JSON.parse(msg.reactions || "{}");
  const users = reactions[emoji] || [];
  const idx = users.indexOf(user.id);
  if (idx > -1) {
    users.splice(idx, 1);
    if (users.length === 0) delete reactions[emoji];
  } else {
    // Remove user from any other reaction first (one reaction per user)
    for (const key of Object.keys(reactions)) {
      reactions[key] = reactions[key].filter((uid) => uid !== user.id);
      if (reactions[key].length === 0) delete reactions[key];
    }
    reactions[emoji] = [user.id];
  }

  db.prepare("UPDATE messages SET reactions = ? WHERE id = ?").run(JSON.stringify(reactions), Number(id));

  return NextResponse.json({ reactions });
}
