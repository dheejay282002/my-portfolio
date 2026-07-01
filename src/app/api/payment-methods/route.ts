import { NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureProductsTable } from "@/lib/schema";

export async function GET() {
  try {
    await ensureProductsTable();
    const methods = await queryAll("SELECT * FROM payment_methods ORDER BY id ASC");
    return NextResponse.json({ methods });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load payment methods" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await ensureProductsTable();
    const { provider_name, account_name, account_number, qr_code_url, is_active } = await req.json();

    if (!provider_name || !account_name || !account_number) {
      return NextResponse.json({ error: "Missing required bank details" }, { status: 400 });
    }

    await execute(
      `INSERT INTO payment_methods (provider_name, account_name, account_number, qr_code_url, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      [provider_name.trim(), account_name.trim(), account_number.trim(), qr_code_url || "", is_active !== false]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
