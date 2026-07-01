import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const request = await queryOne("SELECT * FROM project_requests WHERE id = $1", [id]) as Record<string, any> | null;

    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();

    // Client action: sign contract
    if (user.role !== "admin") {
      if (request.client_id !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const { contract_signed, contract_signed_name } = body;
      if (contract_signed !== undefined) {
        await execute(
          `UPDATE project_requests 
           SET contract_signed = $1, 
               contract_signed_name = $2, 
               contract_signed_at = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END,
               contract_signed_acknowledged = FALSE,
               updated_at = NOW() 
           WHERE id = $3`,
          [!!contract_signed, contract_signed_name || null, Number(id)]
        );

        // Send chat message on contract signature
        if (contract_signed && request.conversation_id) {
          const msg = `✍️ I have signed the project agreement contract!`;
          await execute(
            "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)",
            [request.conversation_id, user.id, msg]
          );
          await execute(
            "UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2",
            [msg, request.conversation_id]
          );
        }

        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Admin actions
    const { status, contract_signed_acknowledged } = body;

    if (contract_signed_acknowledged !== undefined) {
      await execute(
        "UPDATE project_requests SET contract_signed_acknowledged = $1, updated_at = NOW() WHERE id = $2",
        [!!contract_signed_acknowledged, Number(id)]
      );
      return NextResponse.json({ success: true });
    }

    if (status !== undefined) {
      const validStatuses = ["pending", "accepted", "rejected", "in_progress", "testing", "completed", "delivered"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const { rejection_reason } = body;

      await execute(
        `UPDATE project_requests 
         SET status = $1, 
             rejection_reason = CASE WHEN $1 = 'rejected' THEN $2 ELSE NULL END, 
             updated_at = NOW() 
         WHERE id = $3`,
        [status, rejection_reason || null, Number(id)]
      );

      // Send chat message on accept/reject
      if (request.conversation_id) {
        let msg = "";
        if (status === "accepted") {
          msg = "Your project request has been accepted! 🎉 Please sign the project agreement contract.";
        } else if (status === "rejected") {
          msg = rejection_reason 
            ? `Your project request has been rejected. Note from developer: "${rejection_reason}"`
            : "Your project request has been rejected.";
        }
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
    }

    return NextResponse.json({ error: "No action provided" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
