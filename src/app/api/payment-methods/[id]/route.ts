import { NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
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
    const { provider_name, account_name, account_number, qr_code_url, is_active } = await req.json();

    const method = await queryOne("SELECT * FROM payment_methods WHERE id = $1", [Number(id)]);
    if (!method) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }

    await execute(
      `UPDATE payment_methods
       SET provider_name = COALESCE($1, provider_name),
           account_name = COALESCE($2, account_name),
           account_number = COALESCE($3, account_number),
           qr_code_url = COALESCE($4, qr_code_url),
           is_active = COALESCE($5, is_active)
       WHERE id = $6`,
      [
        provider_name !== undefined ? provider_name.trim() : null,
        account_name !== undefined ? account_name.trim() : null,
        account_number !== undefined ? account_number.trim() : null,
        qr_code_url !== undefined ? qr_code_url : null,
        is_active !== undefined ? is_active : null,
        Number(id)
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update payment method" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await execute("DELETE FROM payment_methods WHERE id = $1", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete payment method" }, { status: 500 });
  }
}
