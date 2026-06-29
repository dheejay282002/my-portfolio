import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { id } = await params;
    const { title, description, icon } = await req.json();
    const db = getDb();
    const fields: string[] = [];
    const values: (string | number)[] = [];
    if (title !== undefined) { fields.push("title = ?"); values.push(title); }
    if (description !== undefined) { fields.push("description = ?"); values.push(description); }
    if (icon !== undefined) { fields.push("icon = ?"); values.push(icon); }
    if (fields.length === 0)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    values.push(Number(id));
    db.prepare(`UPDATE services SET ${fields.join(", ")} WHERE id = ?`).run(...values);
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
    const db = getDb();
    db.prepare("DELETE FROM services WHERE id = ?").run(Number(id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
