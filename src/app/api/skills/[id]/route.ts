import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { id } = await params;
    const { name, category, icon } = await req.json();
    const db = getDb();
    const fields: string[] = [];
    const values: (string | number)[] = [];
    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (category !== undefined) { fields.push("category = ?"); values.push(category); }
    if (icon !== undefined) { fields.push("icon = ?"); values.push(icon); }
    if (fields.length === 0)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    values.push(Number(id));
    db.prepare(`UPDATE skills SET ${fields.join(", ")} WHERE id = ?`).run(...values);
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
    db.prepare("DELETE FROM skills WHERE id = ?").run(Number(id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
