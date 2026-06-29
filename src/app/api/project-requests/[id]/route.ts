import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
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

    const request = await queryOne("SELECT * FROM project_requests WHERE id = $1", [id]) as Record<string, any> | null;

    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await execute(
      "UPDATE project_requests SET status = $1, updated_at = NOW() WHERE id = $2",
      [status, Number(id)]
    );

    // Send chat message on accept/reject
    if (request.conversation_id) {
      let msg = "";
      if (status === "accepted") msg = "Your project request has been accepted! 🎉";
      else if (status === "rejected") msg = "Your project request has been rejected.";
      if (msg) {
        await execute(
          "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)",
          [request.conversation_id, user.id, msg]
        );
        await execute(
          "UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2",
          [msg, request.conversation_id]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
