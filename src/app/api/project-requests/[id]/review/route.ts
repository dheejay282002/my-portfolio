import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.role !== "client") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { rating, content } = await req.json();

    if (!rating || rating < 1 || rating > 5 || !content) {
      return NextResponse.json({ error: "Rating (1-5) and content are required" }, { status: 400 });
    }

    // Check if the project request belongs to this client and is delivered
    const request = await queryOne(
      "SELECT * FROM project_requests WHERE id = $1 AND client_id = $2",
      [id, user.id]
    ) as Record<string, any> | null;

    if (!request) {
      return NextResponse.json({ error: "Project request not found" }, { status: 404 });
    }

    if (request.status !== "delivered") {
      return NextResponse.json({ error: "Reviews can only be added for delivered projects" }, { status: 400 });
    }

    // Check if a review already exists
    const existing = await queryOne("SELECT id FROM reviews WHERE project_request_id = $1", [id]) as { id: number } | null;

    if (existing) {
      await execute(`
        UPDATE reviews 
        SET rating = $1, content = $2, created_at = NOW()
        WHERE id = $3
      `, [rating, content, existing.id]);
      return NextResponse.json({ success: true, updated: true }, { status: 200 });
    }

    // Insert the review
    await execute(`
      INSERT INTO reviews (project_request_id, client_id, rating, content)
      VALUES ($1, $2, $3, $4)
    `, [Number(id), user.id, rating, content]);

    return NextResponse.json({ success: true, created: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
