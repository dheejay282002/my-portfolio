import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function GET() {
  try {
    const admin = await queryOne(
      "SELECT id, name, last_name, profile_photo, bio, github_url, linkedin_url, twitter_url FROM users WHERE role = $1 LIMIT 1",
      ["admin"]
    ) as Record<string, any> | null;

    const deliveredCount = await queryOne(
      "SELECT COUNT(*) as count FROM project_requests WHERE status = 'delivered'"
    ) as { count: string | number } | null;

    return NextResponse.json({
      admin: admin ?? null,
      projects_delivered: deliveredCount ? Number(deliveredCount.count) : 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
