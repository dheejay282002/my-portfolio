import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await queryOne(`SELECT id FROM portfolio_settings LIMIT 1`);

    const settings = await queryOne(
      `SELECT * FROM portfolio_settings WHERE slug = $1 AND is_published = true`,
      [slug]
    );

    if (!settings) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Portfolio public GET error:", error);
    return NextResponse.json({ error: "Failed to load portfolio" }, { status: 500 });
  }
}
