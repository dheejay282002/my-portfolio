import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { emoji } = await req.json();
    if (!emoji) return NextResponse.json({ error: "Emoji required" }, { status: 400 });

    const msg = await queryOne("SELECT reactions FROM messages WHERE id = $1", [id]) as { reactions: any } | null;
    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let reactions: Record<string, number[]> = {};
    try {
      reactions = typeof msg.reactions === "object" ? msg.reactions : JSON.parse(msg.reactions || "{}");
    } catch {
      reactions = {};
    }

    const users = reactions[emoji] || [];
    const idx = users.indexOf(user.id);
    if (idx > -1) {
      users.splice(idx, 1);
      if (users.length === 0) {
        delete reactions[emoji];
      } else {
        reactions[emoji] = users;
      }
    } else {
      // Remove user from any other reaction first (one reaction per user)
      for (const key of Object.keys(reactions)) {
        reactions[key] = reactions[key].filter((uid) => uid !== user.id);
        if (reactions[key].length === 0) delete reactions[key];
      }
      reactions[emoji] = [user.id];
    }

    await execute(
      "UPDATE messages SET reactions = $1 WHERE id = $2",
      [JSON.stringify(reactions), Number(id)]
    );

    return NextResponse.json({ reactions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
