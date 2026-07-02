import { NextResponse } from "next/server";
import { queryAll, queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ensureProductsTable } = await import("@/lib/schema");
    await ensureProductsTable();

    const gateways = await queryAll("SELECT id, provider, is_enabled, config, created_at, updated_at FROM payment_gateways ORDER BY provider");
    return NextResponse.json({ gateways });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ensureProductsTable } = await import("@/lib/schema");
    await ensureProductsTable();

    const { provider, is_enabled, config } = await req.json();
    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    await execute(
      `UPDATE payment_gateways SET is_enabled = COALESCE($1, is_enabled), config = COALESCE($2, config), updated_at = NOW() WHERE provider = $3`,
      [is_enabled ?? undefined, config ?? undefined, provider]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
