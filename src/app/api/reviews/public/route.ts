import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const reviews = db
      .prepare(`
        SELECT r.rating, r.content, u.name as client_name, u.profile_photo as client_photo, pr.project_name
        FROM reviews r
        JOIN users u ON r.client_id = u.id
        JOIN project_requests pr ON r.project_request_id = pr.id
        ORDER BY r.created_at DESC
      `)
      .all();

    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
