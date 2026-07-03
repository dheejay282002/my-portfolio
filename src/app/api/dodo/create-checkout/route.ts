import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import DodoPayments from "dodopayments";

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ensureProductsTable } = await import("@/lib/schema");
    await ensureProductsTable();

    const gateway = await queryOne("SELECT config, is_enabled FROM payment_gateways WHERE provider = 'dodo'") as Record<string, any> | null;
    if (!gateway || !gateway.is_enabled) {
      return NextResponse.json({ error: "DODO Payments is not enabled. Configure it in Admin > Payment Methods." }, { status: 500 });
    }

    const config = typeof gateway.config === "string" ? JSON.parse(gateway.config) : gateway.config;
    const apiKey = config.api_key;
    const productId = config.product_id;
    const downpaymentProductId = config.downpayment_product_id || config.product_id;
    const environment = config.environment === "live" ? "live_mode" : "test_mode";

    if (!apiKey || !productId) {
      return NextResponse.json({ error: "DODO Payments not fully configured. Set API key and Product ID in Admin > Payment Methods." }, { status: 500 });
    }

    const client = new DodoPayments({ bearerToken: apiKey, environment });

    const body = await request.json();
    const { type, projectRequestId, returnUrl, cancelUrl } = body;

    if (!type || !projectRequestId) {
      return NextResponse.json({ error: "Missing type or projectRequestId" }, { status: 400 });
    }

    const isDownpayment = type === "downpayment";
    const activeProductId = isDownpayment ? downpaymentProductId : productId;

    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: activeProductId,
          quantity: 1,
        },
      ],
      customer: { email: user.email || "", name: user.name || "" },
      billing_address: { country: body.country || "US" },
      return_url: returnUrl || `${config.return_url || process.env.NEXT_PUBLIC_BASE_URL || ""}/dashboard/client/project-requests`,
      cancel_url: cancelUrl || `${config.return_url || process.env.NEXT_PUBLIC_BASE_URL || ""}/dashboard/client/project-requests`,
      metadata: {
        project_request_id: String(projectRequestId),
        payment_type: type,
        user_id: String(user.id),
      },
    });

    return NextResponse.json({
      session_id: session.session_id,
      checkout_url: session.checkout_url,
    });
  } catch (err: any) {
    console.error("DODO checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
