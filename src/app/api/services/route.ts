import { NextResponse } from "next/server";
import { queryAll, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const services = await queryAll("SELECT * FROM services ORDER BY created_at DESC");
    return NextResponse.json({ services });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { title, description, icon } = await req.json();
    if (!title || !description)
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });

    const result = await queryOne(
      "INSERT INTO services (title, description, icon) VALUES ($1, $2, $3) RETURNING id",
      [title, description, icon || "Code2"]
    ) as { id: number };

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
