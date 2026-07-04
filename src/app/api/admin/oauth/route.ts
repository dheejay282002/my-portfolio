import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await execute(`
      ALTER TABLE web_settings
      ADD COLUMN IF NOT EXISTS google_client_id TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS google_client_secret TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS github_client_id TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS github_client_secret TEXT DEFAULT '';
    `);

    const settings = await queryOne(
      "SELECT google_client_id, google_client_secret, github_client_id, github_client_secret FROM web_settings WHERE id = 1"
    );

    return NextResponse.json({ settings: settings || { google_client_id: "", google_client_secret: "", github_client_id: "", github_client_secret: "" } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { google_client_id, google_client_secret, github_client_id, github_client_secret } = await req.json();

    await execute(
      `UPDATE web_settings
       SET google_client_id = $1, google_client_secret = $2, github_client_id = $3, github_client_secret = $4, updated_at = NOW()
       WHERE id = 1`,
      [google_client_id || "", google_client_secret || "", github_client_id || "", github_client_secret || ""]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
