import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { id } = await params;
    const { title, description, icon } = await req.json();
    const fields: string[] = [];
    const values: (string | number)[] = [];
    let idx = 1;
    if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (icon !== undefined) { fields.push(`icon = $${idx++}`); values.push(icon); }
    if (fields.length === 0)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    values.push(Number(id));
    await execute(`UPDATE services SET ${fields.join(", ")} WHERE id = $${idx}`, values);
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
    const { id } = await params;
    await execute("DELETE FROM services WHERE id = $1", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
