import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import DodoPayments from "dodopayments";

export async function POST() {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ensureProductsTable } = await import("@/lib/schema");
    await ensureProductsTable();

    const gateway = await queryOne("SELECT config FROM payment_gateways WHERE provider = 'dodo'") as Record<string, any> | null;
    if (!gateway) {
      return NextResponse.json({ error: "DODO not configured in database" }, { status: 400 });
    }

    const config = typeof gateway.config === "string" ? JSON.parse(gateway.config) : gateway.config;
    if (!config.api_key) {
      return NextResponse.json({ error: "API Key is required" }, { status: 400 });
    }

    const client = new DodoPayments({
      bearerToken: config.api_key,
      environment: config.environment === "live" ? "live_mode" : "test_mode",
    });

    await client.products.list();

    return NextResponse.json({ success: true, message: "Connection successful! DODO API key is valid." });
  } catch (err: any) {
    const message = err?.message || "Connection failed";
    if (message.includes("401") || message.includes("unauthorized") || message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Invalid API key. Check your DODO API key." }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
