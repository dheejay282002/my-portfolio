import { NextResponse } from "next/server";
import { queryAll, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureEducationsTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureEducationsTable();
    const educations = await queryAll("SELECT * FROM educations ORDER BY id ASC");
    return NextResponse.json({ educations }, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : "Something went wrong") }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await ensureEducationsTable();
    const { school_name, degree, field_of_study, location, start_date, end_date, is_current, description } = await req.json();
    if (!school_name)
      return NextResponse.json({ error: "School name is required" }, { status: 400 });

    const result = await queryOne(
      `INSERT INTO educations (school_name, degree, field_of_study, location, start_date, end_date, is_current, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        school_name,
        degree || "",
        field_of_study || "",
        location || "",
        start_date || "",
        end_date || "",
        is_current === true,
        description || "",
      ]
    ) as { id: number };

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : "Something went wrong") }, { status: 500 });
  }
}
