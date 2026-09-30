import { NextResponse } from "next/server";
import { queryAll, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureWorkExperiencesTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureWorkExperiencesTable();
    const experiences = await queryAll("SELECT * FROM work_experiences ORDER BY id ASC");
    return NextResponse.json({ experiences }, {
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
    await ensureWorkExperiencesTable();
    const { company_name, position, location, start_date, end_date, is_current, description } = await req.json();
    if (!company_name || !position)
      return NextResponse.json({ error: "Company name and position are required" }, { status: 400 });

    const result = await queryOne(
      `INSERT INTO work_experiences (company_name, position, location, start_date, end_date, is_current, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        company_name,
        position,
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
