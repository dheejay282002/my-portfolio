import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await queryOne(
    "SELECT id, name, email, role, last_name, profile_photo, bio, github_url, linkedin_url, twitter_url FROM users WHERE id = $1",
    [session.id]
  );

  return NextResponse.json({ user });
}
