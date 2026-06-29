import { NextResponse } from "next/server";
import { queryAll, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let requests;
    if (user.role === "admin") {
      requests = await queryAll(
        `SELECT r.*, u.name as client_name, u.email as client_email
         FROM project_requests r JOIN users u ON r.client_id = u.id
         ORDER BY r.created_at DESC`
      );
    } else {
      requests = await queryAll(
        `SELECT r.*, rev.rating, rev.content as review_content
         FROM project_requests r
         LEFT JOIN reviews rev ON r.id = rev.project_request_id
         WHERE r.client_id = $1
         ORDER BY r.created_at DESC`,
        [user.id]
      );
    }

    return NextResponse.json({ requests });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { project_name, description, tech_stack, conversation_id } = await req.json();
    if (!project_name || !description) {
      return NextResponse.json({ error: "Project name and description are required" }, { status: 400 });
    }

    const result = await queryOne(
      "INSERT INTO project_requests (client_id, project_name, description, tech_stack, conversation_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [user.id, project_name, description, tech_stack || "", conversation_id || null]
    ) as { id: number };

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
