import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = getDb();
  const user = db
    .prepare("SELECT id, name, email, role, last_name, profile_photo, bio, github_url, linkedin_url, twitter_url FROM users WHERE id = ?")
    .get(session.id) as Record<string, unknown>;

  return NextResponse.json({ user });
}
