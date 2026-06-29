import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const admin = db
    .prepare("SELECT id, name, last_name, profile_photo, bio, github_url, linkedin_url, twitter_url FROM users WHERE role = ? LIMIT 1")
    .get("admin") as Record<string, unknown> | undefined;

  const deliveredCount = db
    .prepare("SELECT COUNT(*) as count FROM project_requests WHERE status = 'delivered'")
    .get() as { count: number } | undefined;

  return NextResponse.json({
    admin: admin ?? null,
    projects_delivered: deliveredCount?.count ?? 0,
  });
}
