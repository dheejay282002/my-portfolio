import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await execute(`
      CREATE TABLE IF NOT EXISTS portfolio_settings (
        id INT PRIMARY KEY DEFAULT 1,
        slug VARCHAR(255) UNIQUE DEFAULT '',
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    let settings = await queryOne(`SELECT * FROM portfolio_settings WHERE id = 1`);
    if (!settings) {
      await execute(`INSERT INTO portfolio_settings (id) VALUES (1)`);
      settings = await queryOne(`SELECT * FROM portfolio_settings WHERE id = 1`);
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Portfolio settings GET error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { slug, is_published } = body;

    await execute(`
      CREATE TABLE IF NOT EXISTS portfolio_settings (
        id INT PRIMARY KEY DEFAULT 1,
        slug VARCHAR(255) UNIQUE DEFAULT '',
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await execute(`INSERT INTO portfolio_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);

    await execute(
      `UPDATE portfolio_settings SET slug = $1, is_published = $2, updated_at = NOW() WHERE id = 1`,
      [slug || "", is_published === true]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Portfolio settings POST error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
