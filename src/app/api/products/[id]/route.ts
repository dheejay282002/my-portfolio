import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureProductsTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await ensureProductsTable();
    const { id } = await params;
    const { package_tier, project_baseline, est_timeline, deliverables } = await req.json();
    const fields: string[] = [];
    const values: (string | number)[] = [];
    let idx = 1;
    if (package_tier !== undefined) { fields.push(`package_tier = $${idx++}`); values.push(package_tier); }
    if (project_baseline !== undefined) { fields.push(`project_baseline = $${idx++}`); values.push(project_baseline); }
    if (est_timeline !== undefined) { fields.push(`est_timeline = $${idx++}`); values.push(est_timeline); }
    if (deliverables !== undefined) { fields.push(`deliverables = $${idx++}`); values.push(deliverables); }
    if (fields.length === 0)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    values.push(Number(id));
    await execute(`UPDATE products SET ${fields.join(", ")} WHERE id = $${idx}`, values);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await ensureProductsTable();
    const { id } = await params;
    await execute("DELETE FROM products WHERE id = $1", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
