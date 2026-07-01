import { NextRequest, NextResponse } from "next/server";
import { queryAll } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureSecurityTables } from "@/lib/schema";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSecurityTables();

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

  try {
    const events = await queryAll(
      "SELECT id, event_type, ip_address, user_agent, email, details, created_at FROM security_events ORDER BY created_at DESC LIMIT $1",
      [limit]
    );

    const count = await queryAll(
      "SELECT event_type, COUNT(*) as cnt FROM security_events GROUP BY event_type ORDER BY cnt DESC"
    ) as { event_type: string; cnt: number }[];

    const recentCount = await queryAll(
      "SELECT COUNT(*) as cnt FROM security_events WHERE created_at > NOW() - INTERVAL '24 hours'"
    ) as { cnt: number }[];

    return NextResponse.json({ events, summary: count, last24h: recentCount[0]?.cnt || 0 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
