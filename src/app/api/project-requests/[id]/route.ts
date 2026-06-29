import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { status } = await req.json();

    const validStatuses = ["pending", "accepted", "rejected", "in_progress", "testing", "completed", "delivered"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = getDb();

    const request = db
      .prepare("SELECT * FROM project_requests WHERE id = ?")
      .get(id) as Record<string, unknown> | undefined;

    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    db.prepare(
      "UPDATE project_requests SET status = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(status, Number(id));

    // Send chat message on accept/reject
    if (request.conversation_id) {
      let msg = "";
      if (status === "accepted") msg = "Your project request has been accepted! 🎉";
      else if (status === "rejected") msg = "Your project request has been rejected.";
      if (msg) {
        db.prepare(
          "INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)"
        ).run(request.conversation_id, user.id, msg);
        db.prepare(
          "UPDATE conversations SET last_message = ?, last_message_at = datetime('now') WHERE id = ?"
        ).run(msg, request.conversation_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
