import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { Webhook } from "standardwebhooks";

export async function POST(request: NextRequest) {
  try {
    const { ensureProductsTable } = await import("@/lib/schema");
    await ensureProductsTable();

    const gateway = await queryOne("SELECT config FROM payment_gateways WHERE provider = 'dodo'") as Record<string, any> | null;
    if (!gateway) {
      return NextResponse.json({ error: "DODO not configured" }, { status: 500 });
    }

    const config = typeof gateway.config === "string" ? JSON.parse(gateway.config) : gateway.config;
    const webhookKey = config.webhook_key;
    if (!webhookKey) {
      return NextResponse.json({ error: "DODO webhook key not configured" }, { status: 500 });
    }

    const rawBody = await request.text();
    const wh = new Webhook(webhookKey);
    const payload = wh.verify(rawBody, {
      "webhook-id": request.headers.get("webhook-id") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    });

    const event = JSON.parse(payload as string);

    if (event.type === "payment.succeeded") {
      const payment = event.data as any;
      const metadata = payment.metadata || {};
      const projectRequestId = metadata.project_request_id;
      const paymentType = metadata.payment_type;

      if (projectRequestId) {
        if (paymentType === "downpayment") {
          await execute(
            `UPDATE project_requests 
             SET status = 'pending', 
                 dodo_downpayment_id = $1,
                 updated_at = NOW() 
             WHERE id = $2`,
            [payment.id, Number(projectRequestId)]
          );
        } else if (paymentType === "final_payment") {
          await execute(
            `UPDATE project_requests 
             SET final_payment_receipt_url = $1,
                 final_payment_reference_no = $2,
                 final_receipt_verified = TRUE,
                 dodo_final_payment_id = $3,
                 updated_at = NOW() 
             WHERE id = $4`,
            [`dodo://${payment.id}`, `DODO-${payment.id}`, payment.id, Number(projectRequestId)]
          );
        }
      }
    } else if (event.type === "payment.failed") {
      const payment = event.data as any;
      const metadata = payment.metadata || {};
      const projectRequestId = metadata.project_request_id;

      if (projectRequestId && metadata.payment_type === "downpayment") {
        await execute(
          "DELETE FROM project_requests WHERE id = $1 AND status = 'pending_payment'",
          [Number(projectRequestId)]
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("DODO webhook error:", err);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }
}
