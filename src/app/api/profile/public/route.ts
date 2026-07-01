import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

async function fetchGithubContributions(username: string): Promise<number> {
  try {
    const res = await fetch(`https://github.com/users/${username}/contributions`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return 0;
    const text = await res.text();
    const match = text.match(/([\d,]+)\s+contributions\s+in/);
    if (match && match[1]) {
      return parseInt(match[1].replace(/,/g, ""), 10);
    }
    return 0;
  } catch {
    return 0;
  }
}

function getGithubUsername(url: string): string | null {
  try {
    const cleanUrl = url.trim().replace(/\/+$/, "");
    const parts = cleanUrl.split("/");
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const { execute } = await import("@/lib/db");
    await execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS cups_of_coffee VARCHAR(50) DEFAULT '0'");
    await execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS contributions VARCHAR(50) DEFAULT '1k+'");
    await execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS github_last_fetched TIMESTAMP");

    let admin = await queryOne(
      "SELECT id, name, last_name, profile_photo, bio, github_url, linkedin_url, twitter_url, cups_of_coffee, contributions, github_last_fetched FROM users WHERE role = $1 LIMIT 1",
      ["admin"]
    ) as Record<string, any> | null;

    if (admin && admin.github_url) {
      const username = getGithubUsername(admin.github_url);
      if (username) {
        const lastFetched = admin.github_last_fetched ? new Date(admin.github_last_fetched).getTime() : 0;
        const now = Date.now();
        if (now - lastFetched > 3600000) {
          const count = await fetchGithubContributions(username);
          if (count > 0) {
            const formatted = count >= 1000 ? `${(count / 1000).toFixed(1)}k+` : `${count}`;
            await execute(
              "UPDATE users SET contributions = $1, github_last_fetched = NOW() WHERE id = $2",
              [formatted, admin.id]
            );
            admin.contributions = formatted;
          }
        }
      }
    }

    const deliveredCount = await queryOne(
      "SELECT COUNT(*) as count FROM project_requests WHERE status = 'delivered'"
    ) as { count: string | number } | null;

    return NextResponse.json({
      admin: admin ?? null,
      projects_delivered: deliveredCount ? Number(deliveredCount.count) : 0,
      cups_of_coffee: admin?.cups_of_coffee ?? "0",
      contributions: admin?.contributions ?? "1k+",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
