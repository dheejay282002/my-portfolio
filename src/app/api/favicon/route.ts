import { NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await execute(`
      ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS favicon_url TEXT DEFAULT '';
    `);
    const row = await queryOne("SELECT favicon_url FROM web_settings WHERE id = 1");
    const url = row?.favicon_url || "";
    if (url) {
      return NextResponse.redirect(url, {
        status: 302,
        headers: { "Cache-Control": "public, max-age=300" },
      });
    }
    return NextResponse.redirect(new URL("/favicon.ico", req.url), {
      status: 302,
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return NextResponse.redirect(new URL("/favicon.ico", req.url), {
      status: 302,
      headers: { "Cache-Control": "public, max-age=300" },
    });
  }
}
