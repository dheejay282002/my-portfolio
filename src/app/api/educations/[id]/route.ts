import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureEducationsTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await ensureEducationsTable();
    const { id } = await params;
    const body = await req.json();
    const allowed = ["school_name", "degree", "field_of_study", "location", "start_date", "end_date", "is_current", "description"];
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(body[key]);
      }
    }
    if (fields.length === 0)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    values.push(Number(id));
    await execute(`UPDATE educations SET ${fields.join(", ")} WHERE id = $${idx}`, values);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : "Something went wrong") }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await ensureEducationsTable();
    const { id } = await params;
    await execute("DELETE FROM educations WHERE id = $1", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : "Something went wrong") }, { status: 500 });
  }
}
