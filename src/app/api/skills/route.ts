import { NextResponse } from "next/server";
import { queryAll, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const skills = await queryAll("SELECT * FROM skills ORDER BY category, name");
    return NextResponse.json({ skills });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { name, category, icon } = await req.json();
    if (!name)
      return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const result = await queryOne(
      "INSERT INTO skills (name, category, icon) VALUES ($1, $2, $3) RETURNING id",
      [name, category || "Other", icon || "Terminal"]
    ) as { id: number };

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
