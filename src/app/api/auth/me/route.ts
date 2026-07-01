import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { execute } = await import("@/lib/db");
  await execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS cups_of_coffee VARCHAR(50) DEFAULT '0'");
  await execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS contributions VARCHAR(50) DEFAULT '1k+'");

  const user = await queryOne(
    "SELECT id, name, email, role, last_name, profile_photo, bio, github_url, linkedin_url, twitter_url, cups_of_coffee, contributions FROM users WHERE id = $1",
    [session.id]
  );

  return NextResponse.json({ user });
}
